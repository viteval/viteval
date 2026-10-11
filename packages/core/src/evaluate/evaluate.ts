import { serializeJson } from '@viteval/internal';
import {
  attempt,
  attemptAsync,
  err,
  isErr,
  ok,
  type Result,
} from 'massaman/control';
import { match } from 'massaman/match';
import {
  afterAll,
  assert,
  beforeAll,
  describe,
  recordArtifact,
  test,
  type TestContext,
} from 'vitest';
import { getEvalProvider } from '#/provider/client';
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
  InferDataOutput,
  TaskArgs,
  InferDataInput,
  InferDataExtra,
  EvalResult,
} from '#/types';

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
>(
  name: string,
  {
    data,
    aggregation = 'mean',
    task,
    scorers,
    threshold = 1,
    testOptions,
  }: Eval<DATA, TASK_OUTPUT>
) {
  if (globalThis.__viteval_datasetDiscovery) {
    globalThis.__viteval_datasetDiscovery.register(data);
    return describe.skip(name, () => {});
  }
  return describe(name, async () => {
    if (!Number.isFinite(threshold) || scorers.length === 0) {
      test(
        'validates evaluation configuration',
        { meta: { viteval: true } },
        () => {
          assert(
            Number.isFinite(threshold),
            'Evaluation threshold must be finite'
          );
          assert(scorers.length > 0, 'Evaluation requires at least one scorer');
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
    }));

    const provider = getEvalProvider();
    let runId: string | undefined;
    const recorded = new Map<
      number,
      { task: TestContext['task']; result: EvalResult }
    >();
    if (provider) {
      // oxlint-disable-next-line no-empty-pattern -- Vitest requires a destructured fixture context before the suite argument.
      beforeAll(async ({}, suite) => {
        const created = await provider.create({
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
        });
        if (isErr(created)) throw created.error;
        runId = created.value.id;
      });
      afterAll(async () => {
        if (!runId) return;
        const values = [...recorded.values()];
        const results: AddEvalResultParams[] = values.map(
          ({ task, result }) => ({
            evalRunId: runId!,
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
            passed: task.result?.state === 'pass',
            metadata: { ...result.metadata, name: result.name },
            duration: task.result?.duration,
          })
        );
        for (const result of results) {
          const saved = await provider.addResult(result);
          if (isErr(saved)) throw saved.error;
        }
        const passedCount = results.filter((result) => result.passed).length;
        const completed = await provider.complete({
          id: runId,
          status: passedCount === results.length ? 'completed' : 'failed',
          summary: {
            meanScore: getMeanScore(
              results.map((result) => ({ name: '', score: result.meanScore }))
            ),
            medianScore: getMedianScore(
              results.map((result) => ({ name: '', score: result.medianScore }))
            ),
            sumScore: results.reduce((sum, result) => sum + result.sumScore, 0),
            passedCount,
            failedCount: results.length - passedCount,
            totalCount: results.length,
            passed: passedCount === results.length,
          },
        });
        if (isErr(completed)) throw completed.error;
      });
    }

    test.for(cases.map((item, index) => ({ ...item, index })))(
      '$testName',
      {
        ...testOptions,
        meta: { ...testOptions?.meta, viteval: true },
      },
      async (
        { dataItem, testName, index },
        { task: currentTask, annotate, onTestFinished }
      ) => {
        const { input, expected, ...metadata } = dataItem;
        let finished = false;
        let result: EvalResult | undefined;
        let hasArtifact = false;
        const failureResult = (error: unknown): EvalResult => ({
          name: testName,
          input: safeJson(input),
          expected: safeJson(expected),
          output: null,
          aggregation,
          threshold,
          mean: 0,
          median: 0,
          sum: 0,
          scores: [],
          metadata: {
            executionError:
              error instanceof Error ? error.message : String(error),
          },
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
              type: EVAL_RESULT_ARTIFACT_TYPE,
              result,
            });
          }
          if (result) recorded.set(index, { task: currentTask, result });
        });
        try {
          serializeJson(dataItem);
          const args = taskArgs<DATA>(dataItem);
          const taskResult = await task(args);
          if (finished) return;
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
          if (finished) return;
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
            name: testName,
            input,
            expected,
            output: taskResult,
            aggregation,
            threshold,
            mean: getMeanScore(scoresWithName),
            median: getMedianScore(scoresWithName),
            sum: getSumScore(scoresWithName),
            scores: scoresWithName,
            metadata,
          };
          serializeJson(result);
          await recordArtifact(currentTask, {
            type: EVAL_RESULT_ARTIFACT_TYPE,
            result,
          });
          hasArtifact = true;
          for (const score of scoresWithName)
            await annotate(`${score.name}: ${score.score}`);
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
          if (finished) return;
          if (!hasArtifact) {
            result = failureResult(error);
            await recordArtifact(currentTask, {
              type: EVAL_RESULT_ARTIFACT_TYPE,
              result,
            });
          }
          throw error;
        }
      }
    );
  });
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
    return await attemptAsync(data);
  }

  if (isDataset(data)) {
    const loaded = await data.load({ create: true });
    if (isErr(loaded)) return loaded;
    return loaded.value === null
      ? err('Dataset returned no data')
      : ok(loaded.value);
  }

  return ok(data);
}

function isDataset(
  data: Data<DataItem>
): data is Dataset<DataGenerator<DataItem>> {
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
