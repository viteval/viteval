import { randomUUID } from 'node:crypto';

import { mapAsync, uniq } from 'massaman/array';
import { attemptAsync, isErr } from 'massaman/control';
import { once } from 'massaman/function';
import { match } from 'massaman/match';
import { Semaphore } from 'massaman/promise';
import type { RunnerTestSuite as Suite, TestContext } from 'vitest';

import { getProjectRuntime, getRuntimeContext } from '#/config/runtime';
import { bindExecution, getExecutionScope } from '#/config/execution';
import { EVAL_RESULT_ARTIFACT_TYPE } from '#/evaluate/artifact';
import {
  createFailureResult,
  createUnscoredResult,
  evaluationScore,
  runEvaluationCase,
  validateEvaluationOptions,
} from '#/evaluate/case';
import type { NormalizedEvalResult } from '#/evaluate/case';
import {
  formatEvaluationCaseName,
  resolveEvaluationData,
} from '#/evaluate/data';
import {
  openEvaluationPersistence,
  projectEvaluationResult,
} from '#/evaluate/persistence';
import { getResultDestinations } from '#/provider/destinations';
import type { Data, Eval, InferDataOutput } from '#/types';

interface EvaluationPersistence {
  create(suite: Readonly<Suite>): Promise<void>;
  complete(suite: Readonly<Suite>, scope: Readonly<Suite>): Promise<void>;
}

interface RegisterEvaluationParams<DATA extends Data, TASK_OUTPUT> {
  name: string;
  options: Eval<DATA, TASK_OUTPUT>;
}

// The public entry point also runs in config modules, outside runner workers.
const runner = await loadEngine();

/**
 * Adapt an evaluation declaration to Vitest's collection and execution lifecycle.
 * @param params - Evaluation name and public options.
 * @returns Nothing; registers engine suites, hooks, and cases.
 * @example registerEvaluation({ name: 'support', options });
 * @internal
 */
export function registerEvaluation<
  DATA extends Data,
  TASK_OUTPUT = InferDataOutput<DATA>,
>({ name, options }: RegisterEvaluationParams<DATA, TASK_OUTPUT>): void {
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
    };
  const discovery = getExecutionScope()?.discovery;
  if (discovery) {
    discovery.register(data);
    describe.skip(name, () => {});
    return;
  }
  const evaluationId = randomUUID();
  // The declaring scope wraps its beforeAll, afterAll, and returned cleanup hooks.
  // A child-suite afterAll would finalize before those hooks have finished.
  aroundAll(
    bindExecution(
      async (
        runSuite: () => Promise<void>,
        // oxlint-disable-next-line no-empty-pattern -- Vitest requires a destructured fixture context before the suite argument.
        {}: Record<string, never>,
        scope: Readonly<Suite>
      ) => {
        const persist = await prepare();
        const suite = scope.tasks.find(
          (task): task is Suite =>
            task.type === 'suite' &&
            task.meta.vitevalEvaluationId === evaluationId
        );
        if (!persist || !suite) {
          return runSuite();
        }
        const execution = await attemptAsync(async () => {
          await persist.create(suite);
          await runSuite();
        });
        const completion = await attemptAsync(() =>
          persist.complete(suite, scope)
        );
        const errors = [execution, completion]
          .filter(isErr)
          .map((result) => result.error);
        if (errors.length === 1) {
          throw errors[0];
        }
        if (errors.length > 1) {
          throw new AggregateError(
            errors,
            `Evaluation execution and persistence failed: ${errors.map(String).join('; ')}`
          );
        }
      }
    )
  );
  const prepare = once(
    bindExecution(async () => {
      const validation = validateEvaluationOptions({
        threshold,
        concurrency,
        timeout,
        retries,
        scorerCount: scorers.length,
      });
      if (isErr(validation)) {
        test(
          'validates evaluation configuration',
          { meta: { viteval: true } },
          () => assert(false, validation.error.message)
        );
        return;
      }
      const formattedData = await resolveEvaluationData({
        data,
        context: getRuntimeContext(),
      });
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
          testName: formatEvaluationCaseName(dataItem),
        })),
        providers = await getResultDestinations(destinations),
        acquireCase = createCaseLimiter(concurrency);
      const recorded = new Map<string, NormalizedEvalResult>();
      const openPersistence = once((suite: Readonly<Suite>) =>
        openEvaluationPersistence({
          providers,
          run: {
            name,
            metadata: {
              filepath: suite.file.filepath,
              projectName: suite.file.projectName,
            },
            config: {
              aggregation,
              threshold,
              scorerNames: scorers.map((scorer) => scorer.name),
              timeout: testOptions.timeout,
            },
          },
        })
      );
      const persist: EvaluationPersistence = {
        async complete(suite, scope) {
          const persistence = await openPersistence(suite);
          const suiteErrors = uniq([
            ...persistence.errors,
            ...(suite.result?.errors?.map((error) => error.message) ?? []),
            ...(scope.result?.errors?.map((error) => error.message) ?? []),
          ]);
          const tasks = suite.tasks.filter(
            (task): task is TestContext['task'] =>
              task.type === 'test' &&
              task.meta.vitevalEvaluationId === evaluationId
          );
          const results = await mapAsync(
            tasks,
            async (task, index) => {
              const state = getCaseState(task);
              const taskErrors = match(state)
                .with(
                  'failed',
                  () => task.result?.errors?.map((error) => error.message) ?? []
                )
                .with('passed', 'skipped', () => [])
                .exhaustive();
              const errors = [...taskErrors, ...suiteErrors];
              const diagnostic = errors.join('\n');
              const previous = recorded.get(task.id);
              const result: NormalizedEvalResult =
                previous ??
                createUnscoredResult({
                  name: cases[index].testName,
                  dataItem: cases[index].dataItem,
                  aggregation,
                  threshold,
                });
              const projected = projectEvaluationResult({
                result,
                state,
                errors,
                duration: task.result?.duration,
              });
              if (!previous || diagnostic) {
                await recordArtifact(task, {
                  type: EVAL_RESULT_ARTIFACT_TYPE,
                  result: projected.artifact,
                });
              }
              return projected.stored;
            },
            { concurrency: 1 }
          );
          await persistence.complete({ results, errors: suiteErrors });
        },
        async create(suite) {
          const persistence = await openPersistence(suite);
          await persistence.verify();
        },
      };

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
          recorded.delete(currentTask.id);
          const cancellation = new AbortController();
          const acquired = acquireCase();
          const failureResult = (error: unknown) =>
            createFailureResult({
              dataItem,
              aggregation,
              threshold,
              name: testName,
              error,
            });
          onTestFinished(async () => {
            cancellation.abort();
            void acquired.then((release) => release());
            if (!recorded.has(currentTask.id)) {
              const result = failureResult(
                currentTask.result?.errors
                  ?.map((error) => error.message)
                  .join('\n') ?? 'Evaluation did not complete'
              );
              await recordArtifact(currentTask, {
                result,
                type: EVAL_RESULT_ARTIFACT_TYPE,
              });
              recorded.set(currentTask.id, result);
            }
          });
          const release = await acquired;
          if (cancellation.signal.aborted) {
            release();
            return;
          }
          try {
            const outcome = await runEvaluationCase<DATA, TASK_OUTPUT>({
              dataItem,
              name: testName,
              task,
              scorers,
              aggregation,
              threshold,
              signal: cancellation.signal,
            });
            if (isErr(outcome)) {
              throw outcome.error;
            }
            const result = outcome.value;
            if (!result) {
              return;
            }
            await recordArtifact(currentTask, {
              result,
              type: EVAL_RESULT_ARTIFACT_TYPE,
            });
            recorded.set(currentTask.id, result);
            for (const score of result.scores) {
              await annotate(`${score.name}: ${score.score}`);
            }
            const aggregateScore = evaluationScore(result);
            assert(
              aggregateScore >= threshold,
              `${aggregation} score ${aggregateScore} is below threshold ${threshold}`
            );
          } catch (error) {
            if (cancellation.signal.aborted) {
              return;
            }
            if (!recorded.has(currentTask.id)) {
              const result = failureResult(error);
              await recordArtifact(currentTask, {
                result,
                type: EVAL_RESULT_ARTIFACT_TYPE,
              });
              recorded.set(currentTask.id, result);
            }
            throw error;
          } finally {
            release();
          }
        }
      );
      if (!providers.length) {
        return;
      }
      return persist;
    })
  );
  describe(name, { meta: { vitevalEvaluationId: evaluationId } }, async () => {
    await prepare();
  });
}

function createCaseLimiter(concurrency: number) {
  const semaphore = new Semaphore(concurrency);
  return async () => {
    await semaphore.acquire();
    return once(() => semaphore.release());
  };
}

function getCaseState(
  task: Readonly<TestContext['task']>
): 'passed' | 'failed' | 'skipped' {
  if (task.result?.state === 'pass') {
    return 'passed';
  }
  if (
    task.result?.state === 'skip' ||
    task.result?.state === 'todo' ||
    task.mode === 'skip' ||
    task.mode === 'todo'
  ) {
    return 'skipped';
  }
  return 'failed';
}

async function loadEngine() {
  if (!process.env.VITEST_WORKER_ID) {
    return undefined;
  }
  return import('vitest');
}
