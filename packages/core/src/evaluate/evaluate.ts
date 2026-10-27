import { randomUUID } from 'node:crypto';
import { serializeJson } from '@viteval/internal';
import {
  type Result,
  attempt,
  attemptAsync,
  err,
  isErr,
  ok,
} from 'massaman/control';
import { match } from 'massaman/match';
import type { RunnerTestSuite as Suite, TestContext } from 'vitest';
import {
  getResultDestinations,
  writeDestinations,
} from '#/provider/destinations';
import { getProjectRuntime, getRuntimeContext } from '#/config/runtime';
import type { AddEvalResultParams } from '#/provider/types';
import { EVAL_RESULT_ARTIFACT_TYPE } from '#/evaluate/artifact';
import { resolve } from '#/internals/utils';
import {
  getMeanScore,
  getMedianScore,
  getSumScore,
} from '#/scorer/aggregation';
import type {
  Data,
  DataGenerator,
  DataItem,
  Dataset,
  Eval,
  EvalResult,
  InferDataExtra,
  InferDataInput,
  InferDataOutput,
  TaskArgs,
} from '#/types';

// The public entry point also runs in config modules, outside runner workers.
const runner = process.env.VITEST_WORKER_ID
  ? await import('vitest')
  : undefined;

/**
 * Evaluate an LLM model, task, workflow or other related system.
 *
 * @example
 * ```ts
 * import { evaluate, scorers } from 'viteval';
 *
 * evaluate('my test', {
 *   task: async () => {
 *     return 'Generate a random number between 0 and 100';
 *   },
 *   scorers: [scorers.exactMatch()],
 *   data: [
 *     {
 *       input: 'Generate a random number between 0 and 100',
 *       expected: 1,
 *     },
 *   ],
 * });
 * ```
 *
 * @param name - The name of the evaluation.
 * @param eval - The evaluation configuration.
 * @returns The evaluation result.
 */
export function evaluate<
  DATA extends Data,
  TASK_OUTPUT = InferDataOutput<DATA>,
>(name: string, options: Eval<DATA, TASK_OUTPUT>) {
  if (!runner) {
    throw new Error(
      'evaluate() must run in an evaluation module through viteval run'
    );
  }
  const assert: typeof runner.assert = runner.assert;
  const { aroundAll, describe, recordArtifact, test } = runner,
    defaults = getProjectRuntime()?.config.eval,
    {
      data,
      aggregation = 'mean',
      task,
      scorers,
      threshold = 1,
      timeout,
      concurrency = 5,
      retries,
      results: destinations,
      skip,
    } = { ...defaults, ...options },
    testOptions = {
      concurrent: concurrency > 1,
      retry: retries,
      skip,
      timeout,
    },
    acquireCase = createCaseLimiter(concurrency);
  if (globalThis.__viteval_datasetDiscovery) {
    globalThis.__viteval_datasetDiscovery.register(data);
    return describe.skip(name, () => {});
  }
  const evaluationId = randomUUID();
  let persist:
    | {
        create: (suite: Readonly<Suite>) => Promise<void>;
        complete: (
          suite: Readonly<Suite>,
          scope: Readonly<Suite>
        ) => Promise<void>;
      }
    | undefined;
  // The declaring scope wraps its beforeAll, afterAll, and returned cleanup hooks.
  // A child-suite afterAll would finalize before those hooks have finished.
  // oxlint-disable-next-line no-empty-pattern -- Vitest requires a destructured fixture context before the suite argument.
  aroundAll(async (runSuite, {}, scope) => {
    const suite = scope.tasks.find(
      (task): task is Suite =>
        task.type === 'suite' && task.meta.vitevalEvaluationId === evaluationId
    );
    if (!persist || !suite) {
      return runSuite();
    }
    await persist.create(suite);
    try {
      await runSuite();
    } finally {
      await persist.complete(suite, scope);
    }
  });
  return describe(
    name,
    { meta: { vitevalEvaluationId: evaluationId } },
    async () => {
      if (
        !Number.isFinite(threshold) ||
        scorers.length === 0 ||
        !Number.isSafeInteger(concurrency) ||
        concurrency < 1 ||
        (timeout !== undefined &&
          (!Number.isFinite(timeout) || timeout <= 0)) ||
        (retries !== undefined &&
          (!Number.isSafeInteger(retries) || retries < 0))
      ) {
        test(
          'validates evaluation configuration',
          { meta: { viteval: true } },
          () => {
            assert(
              Number.isFinite(threshold),
              'Evaluation threshold must be finite'
            );
            assert(
              scorers.length > 0,
              'Evaluation requires at least one scorer'
            );
            assert(
              Number.isSafeInteger(concurrency) && concurrency > 0,
              'Evaluation concurrency must be a positive integer'
            );
            assert(
              timeout === undefined ||
                (Number.isFinite(timeout) && timeout > 0),
              'Evaluation timeout must be positive'
            );
            assert(
              retries === undefined ||
                (Number.isSafeInteger(retries) && retries >= 0),
              'Evaluation retries must be a non-negative integer'
            );
          }
        );
        return;
      }
      const formattedData = await formatData(data);
      if (isErr(formattedData)) {
        test('loads evaluation data', { meta: { viteval: true } }, () =>
          assert(false, formattedData.error.message)
        );
        return;
      }

      if (formattedData.value.length === 0) {
        test('loads evaluation data', { meta: { viteval: true } }, () =>
          assert(false, 'Evaluation dataset is empty')
        );
        return;
      }

      const cases = formattedData.value.map((dataItem) => ({
          dataItem,
          testName: formatTestName(dataItem),
        })),
        providers = await getResultDestinations(destinations);
      let runIds: string[] = [];
      const recorded = new Map<string, EvalResult>();
      if (providers.length) {
        persist = {
          async complete(suite, scope) {
            if (!runIds.length) return;
            const suiteErrors = [
              ...new Set([
                ...(suite.result?.errors?.map((error) => error.message) ?? []),
                ...(scope.result?.errors?.map((error) => error.message) ?? []),
              ]),
            ];
            const tasks = suite.tasks.filter(
              (task): task is TestContext['task'] =>
                task.type === 'test' &&
                task.meta.vitevalEvaluationId === evaluationId
            );
            const results: AddEvalResultParams[] = [];
            for (const [index, task] of tasks.entries()) {
              const state =
                task.result?.state === 'pass'
                  ? 'passed'
                  : task.result?.state === 'skip' ||
                      task.result?.state === 'todo' ||
                      task.mode === 'skip' ||
                      task.mode === 'todo'
                    ? 'skipped'
                    : 'failed';
              const errors = [
                ...(state === 'failed'
                  ? (task.result?.errors?.map((error) => error.message) ?? [])
                  : []),
                ...suiteErrors,
              ];
              const diagnostic = errors.join('\n');
              const previous = recorded.get(task.id);
              const result: EvalResult = previous ?? {
                name: cases[index].testName,
                input: safeJson(cases[index].dataItem.input),
                expected: safeJson(cases[index].dataItem.expected),
                output: null,
                aggregation,
                threshold,
                mean: 0,
                median: 0,
                sum: 0,
                scores: [],
              };
              const metadata = {
                ...result.metadata,
                name: result.name,
                state,
                ...(diagnostic ? { executionError: diagnostic } : {}),
              };
              if (!previous || diagnostic) {
                await recordArtifact(task, {
                  type: EVAL_RESULT_ARTIFACT_TYPE,
                  result: { ...result, metadata },
                });
              }
              results.push({
                evalRunId: '',
                input: result.input ?? null,
                expected: result.expected ?? null,
                output: result.output ?? null,
                scores: result.scores.map((score) => ({
                  ...score,
                  score: score.score ?? 0,
                })),
                meanScore: result.mean,
                medianScore: result.median,
                sumScore: result.sum,
                passed: state === 'passed',
                metadata,
                duration: task.result?.duration,
              });
            }
            const passedCount = results.filter(
              (result) => result.passed
            ).length;
            const failedCount = results.filter(
              (result) => result.metadata?.state === 'failed'
            ).length;
            const scored = results.filter(
              (result) => result.metadata?.state !== 'skipped'
            );
            const passed = suiteErrors.length === 0 && failedCount === 0;
            await writeDestinations(
              providers.map((provider, index) => async () => {
                for (const result of results) {
                  const saved = await provider.addResult({
                    ...result,
                    evalRunId: runIds[index],
                  });
                  if (isErr(saved)) return saved;
                }
                return provider.complete({
                  id: runIds[index],
                  status: passed ? 'completed' : 'failed',
                  summary: {
                    meanScore: getMeanScore(
                      scored.map((result) => ({
                        name: '',
                        score: result.meanScore,
                      }))
                    ),
                    medianScore: getMedianScore(
                      scored.map((result) => ({
                        name: '',
                        score: result.medianScore,
                      }))
                    ),
                    sumScore: scored.reduce(
                      (sum, result) => sum + result.sumScore,
                      0
                    ),
                    passedCount,
                    failedCount,
                    totalCount: results.length,
                    passed,
                  },
                });
              })
            );
          },
          async create(suite) {
            const created = await writeDestinations(
              providers.map(
                (provider) => () =>
                  provider.create({
                    name,
                    metadata: {
                      filepath: suite.file.filepath,
                      projectName: suite.file.projectName,
                    },
                    config: {
                      aggregation,
                      threshold,
                      scorerNames: scorers.map((scorer) => scorer.name),
                      timeout: testOptions?.timeout,
                    },
                  })
              )
            );
            runIds = created.map((run) => run.id);
          },
        };
      }

      test.for(cases)(
        '$testName',
        {
          ...testOptions,
          meta: {
            viteval: true,
            vitevalEvaluationId: evaluationId,
          },
        },
        async (
          { dataItem, testName },
          { task: currentTask, annotate, onTestFinished }
        ) => {
          const { input, expected, ...metadata } = dataItem;
          let finished = false,
            result: EvalResult | undefined,
            hasArtifact = false;
          const failureResult = (error: unknown): EvalResult => ({
            aggregation,
            expected: safeJson(expected),
            input: safeJson(input),
            mean: 0,
            median: 0,
            metadata: {
              executionError:
                error instanceof Error ? error.message : String(error),
            },
            name: testName,
            output: null,
            scores: [],
            sum: 0,
            threshold,
          });
          onTestFinished(async () => {
            finished = true;
            if (!hasArtifact) {
              result = failureResult(
                currentTask.result?.errors
                  ?.map((error) => error.message)
                  .join('\n') ?? 'Evaluation did not complete'
              );
              await recordArtifact(currentTask, {
                result,
                type: EVAL_RESULT_ARTIFACT_TYPE,
              });
            }
            if (result) {
              recorded.set(currentTask.id, result);
            }
          });
          const release = await acquireCase();
          if (finished) {
            release();
            return;
          }
          try {
            serializeJson(dataItem);
            const args = taskArgs<DATA>(dataItem),
              taskResult = await task(args);
            if (finished) {
              return;
            }
            serializeJson({ output: taskResult });
            const scores = await Promise.all(
              scorers.map((scorer) =>
                resolve(
                  scorer({
                    ...args,
                    expected,
                    output: taskResult,
                  })
                )
              )
            );
            if (finished) {
              return;
            }
            const scoresWithName = scores.map((score, scorerIndex) => {
              const value = score.score ?? 0;
              assert(
                Number.isFinite(value),
                `Scorer ${score.name || scorers[scorerIndex].name} returned a non-finite score`
              );
              return {
                ...score,
                name: score.name || scorers[scorerIndex].name,
                score: value,
              };
            });
            result = {
              aggregation,
              expected,
              input,
              mean: getMeanScore(scoresWithName),
              median: getMedianScore(scoresWithName),
              metadata,
              name: testName,
              output: taskResult,
              scores: scoresWithName,
              sum: getSumScore(scoresWithName),
              threshold,
            };
            serializeJson(result);
            await recordArtifact(currentTask, {
              result,
              type: EVAL_RESULT_ARTIFACT_TYPE,
            });
            hasArtifact = true;
            for (const score of scoresWithName) {
              await annotate(`${score.name}: ${score.score}`);
            }
            const aggregateScore = match(aggregation)
              .with('mean', () => result!.mean)
              .with('median', () => result!.median)
              .with('sum', () => result!.sum)
              .exhaustive();
            assert(
              aggregateScore >= threshold,
              `${aggregation} score ${aggregateScore} is below threshold ${threshold}`
            );
          } catch (error) {
            if (finished) {
              return;
            }
            if (!hasArtifact) {
              result = failureResult(error);
              await recordArtifact(currentTask, {
                result,
                type: EVAL_RESULT_ARTIFACT_TYPE,
              });
            }
            throw error;
          } finally {
            release();
          }
        }
      );
    }
  );
}

/*
|------------------
| Internals
|------------------
*/

async function formatData<DATA extends Data>(
  data: DATA
): Promise<
  Result<
    DataItem<
      InferDataInput<DATA>,
      InferDataOutput<DATA>,
      InferDataExtra<DATA>
    >[]
  >
>;
async function formatData(data: Data): Promise<Result<DataItem[]>> {
  if (typeof data === 'function') {
    const resolved = await attemptAsync(async () => data(getRuntimeContext()));
    if (isErr(resolved)) {
      return resolved;
    }
    return formatData(resolved.value);
  }

  if (isDataset(data)) {
    const loaded = await data.load({ create: true });
    if (Array.isArray(loaded)) {
      return ok(loaded);
    }
    if (isErr(loaded)) {
      return loaded;
    }
    return loaded.value === null
      ? err('Dataset returned no data')
      : ok(loaded.value);
  }

  return ok(data);
}

function isDataset(
  data: Data<DataItem>
): data is
  | Dataset<DataGenerator<DataItem>>
  | import('#/provider/registry').DatasetReference {
  return (
    typeof data === 'object' &&
    data !== null &&
    'load' in data &&
    typeof data.load === 'function'
  );
}

function safeJson(value: unknown): unknown {
  try {
    return JSON.parse(serializeJson(value));
  } catch {
    return null;
  }
}

function createCaseLimiter(concurrency: number) {
  let active = 0;
  const waiting: (() => void)[] = [];
  return async () => {
    if (active >= concurrency) {
      await new Promise<void>((resolve) => waiting.push(resolve));
    } else {
      active++;
    }
    return () => {
      const next = waiting.shift();
      if (next) {
        next();
      } else {
        active--;
      }
    };
  };
}

function taskArgs<DATA extends Data>(
  item: DataItem<
    InferDataInput<DATA>,
    InferDataOutput<DATA>,
    InferDataExtra<DATA>
  >
): TaskArgs<InferDataInput<DATA>, InferDataExtra<DATA>>;
function taskArgs(item: DataItem): TaskArgs<unknown, Record<string, unknown>> {
  const { expected: _expected, output: _output, ...args } = item;
  return args;
}

function formatTestName(dataItem: DataItem): string {
  if (dataItem.name && typeof dataItem.name === 'string') {
    return dataItem.name;
  }

  if (typeof dataItem.input === 'string') {
    return dataItem.input;
  }

  const serialized = attempt(() => JSON.stringify(dataItem.input));
  return serialized.ok
    ? `input: ${serialized.value}`
    : 'input: [unserializable]';
}
