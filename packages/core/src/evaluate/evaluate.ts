import { hasKey, isObject } from '@viteval/internal';
import { match } from 'ts-pattern';
import { assert, describe, test } from 'vitest';
import { getRuntimeConfig } from '#/internals/config';
import { resolve } from '#/internals/utils';
import {
  getMeanScore,
  getMedianScore,
  getSumScore,
} from '#/scorer/aggregation';
import type { EvalProvider } from '#/provider/types';
import type {
  Data,
  DataGenerator,
  DataItem,
  Dataset,
  Eval,
  EvalResult,
  InferDataOutput,
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
  DATA_ITEM extends DataItem,
  DATA extends Data<DATA_ITEM>,
  TASK_OUTPUT = InferDataOutput<DATA>,
>(
  name: string,
  {
    data,
    aggregation = 'mean',
    task,
    scorers,
    threshold = 1,
    timeout,
  }: Eval<DATA, TASK_OUTPUT>
) {
  return describe(name, async () => {
    const config = getRuntimeConfig();
    const formattedData = await formatData(data);

    for (const dataItem of formattedData) {
      const { input, ...params } = dataItem;
      const testName = formatTestName(dataItem);
      test(
        testName,
        {
          timeout: timeout ?? config.eval?.timeout ?? 25_000,
        },
        async ({ task: currentTask, annotate }) => {
          // @ts-expect-error - this is valid
          const taskResult = await task({
            ...params,
            input,
          });

          const scores = await Promise.all(
            scorers.map((scorer) => {
              // @ts-expect-error - this is valid
              const result = scorer({
                ...params,
                input,
                output: taskResult,
              });

              return resolve(result);
            })
          );

          const scoresWithName = scores.map((s, i) => ({
            ...s,
            name: scorers[i].name,
            score: s.score ?? 0,
          }));

          const meanScore = getMeanScore(scores);
          const medianScore = getMedianScore(scores);
          const sumScore = getSumScore(scores);

          const {
            input: _input,
            expected: _expected,
            output: _output,
            ...metadata
          } = params;

          currentTask.meta.evalResult = {
            aggregation,
            expected: dataItem.expected,
            input: dataItem.input,
            mean: meanScore,
            median: medianScore,
            metadata,
            name: testName,
            output: taskResult,
            scores: scoresWithName,
            sum: sumScore,
            threshold,
          };

          for (const score of scoresWithName) {
            await annotate(`${score.name}: ${score.score}`);
          }

          if (threshold) {
            const pass = match(aggregation)
              .with('mean', () => meanScore >= threshold)
              .with('median', () => medianScore >= threshold)
              .with('sum', () => sumScore >= threshold)
              .exhaustive();

            assert(pass, `Score: ${meanScore} below threshold: ${threshold}`);
          }
        }
      );
    }
  });
}

/*
|------------------
| Internals
|------------------
*/

async function formatData<DATA_ITEM extends DataItem>(
  data: Data<DATA_ITEM>
): Promise<DATA_ITEM[]> {
  if (typeof data === 'function') {
    const d = await data();
    return d as DATA_ITEM[];
  }

  if (isDataset(data)) {
    const d = await data.load({ create: true });
    return d as unknown as DATA_ITEM[];
  }

  return data;
}

function isDataset(
  data: Data<DataItem>
): data is Dataset<DataGenerator<DataItem>> {
  // @ts-expect-error - this is valid
  return isObject(data) && hasKey(data, 'load');
}

function formatTestName(dataItem: DataItem): string {
  if (dataItem.name && typeof dataItem.name === 'string') {
    return dataItem.name;
  }

  if (typeof dataItem.input === 'string') {
    return dataItem.input;
  }

  return `input: ${JSON.stringify(dataItem.input)}`;
}

/**
 * Persist evaluation results to the configured eval provider.
 *
 * @param evalProvider - The eval provider to persist to.
 * @param name - The name of the evaluation run.
 * @param results - The evaluation results to persist.
 * @param config - Configuration for the eval run.
 */
export async function persistEvalRun(
  evalProvider: EvalProvider,
  name: string,
  results: EvalResult[],
  config: {
    aggregation: 'mean' | 'median' | 'sum';
    threshold: number;
    scorerNames: string[];
    timeout?: number;
  }
): Promise<void> {
  if (results.length === 0) {
    return;
  }

  const runResult = await evalProvider.create({
    config,
    name,
  });

  if (!runResult.ok) {
    // eslint-disable-next-line no-console -- surface persistence failures
    console.warn('[viteval] Failed to persist eval run:', runResult.result);
    return;
  }

  const run = runResult.result;
  let failed = false;

  const resultParams = results.map((result) => ({
    evalRunId: run.id,
    expected: result.expected,
    input: result.input,
    meanScore: result.mean,
    medianScore: result.median,
    metadata: result.metadata,
    output: result.output,
    passed: match(result.aggregation)
      .with('mean', () => result.mean >= result.threshold)
      .with('median', () => result.median >= result.threshold)
      .with('sum', () => result.sum >= result.threshold)
      .exhaustive(),
    scores: result.scores.map((s) => ({
      metadata: s.metadata,
      name: s.name,
      score: s.score ?? 0,
    })),
    sumScore: result.sum,
  }));

  // Use batch addResults if available, otherwise fall back to parallel individual inserts
  if (evalProvider.addResults) {
    const batchResult = await evalProvider.addResults(resultParams);
    if (!batchResult.ok) {
      failed = true;
    }
  } else {
    const addResults = await Promise.all(
      resultParams.map((params) => evalProvider.addResult(params))
    );
    if (addResults.some((r) => !r.ok)) {
      failed = true;
    }
  }

  const passedCount = resultParams.filter((r) => r.passed).length;
  const totals = results.reduce(
    (acc, r) => ({
      mean: acc.mean + r.mean,
      median: acc.median + r.median,
      sum: acc.sum + r.sum,
    }),
    { mean: 0, median: 0, sum: 0 }
  );

  await evalProvider.complete({
    id: run.id,
    status: failed ? 'failed' : 'completed',
    summary: {
      failedCount: results.length - passedCount,
      meanScore: totals.mean / results.length,
      medianScore: totals.median / results.length,
      passed: passedCount === results.length,
      passedCount,
      sumScore: totals.sum,
      totalCount: results.length,
    },
  });
}
