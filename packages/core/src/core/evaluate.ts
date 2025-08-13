import { match } from 'ts-pattern';
import { afterAll, assert, beforeAll, describe, test } from 'vitest';
import { getConfig } from '#/config/utils';
import { resolve } from '#/internals/utils';
import { initializeProvider } from '#/provider/initialize';
import {
  getMeanScore,
  getMedianScore,
  getSumScore,
} from '#/scorer/aggregation';
import type { Data, DataItem, Eval, EvalResult } from '#/types';

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
 *   scorers: [scorers.exactMatch],
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
>(
  name: string,
  {
    data,
    aggregation = 'mean',
    task,
    scorers,
    threshold = 1.0,
    timeout = 10000,
  }: Eval<DATA>
) {
  return describe(name, async () => {
    const results: EvalResult[] = [];

    beforeAll(() => {
      initializeProvider(getConfig().provider);
    });

    afterAll((suite) => {
      // @ts-expect-error - this is valid
      suite.meta.results = results;
    });

    for (const dataItem of await formatData(data)) {
      const { input, ...params } = dataItem;
      const name = formatTestName(dataItem);
      test(
        formatTestName(dataItem),
        {
          timeout,
        },
        async () => {
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
                output: taskResult,
              });

              return resolve(result);
            })
          );

          const scoresWithName = scores.map((s, i) => ({
            ...s,
            score: s.score ?? 0,
            name: scorers[i].name,
          }));

          const meanScore = getMeanScore(scores);
          const medianScore = getMedianScore(scores);
          const sumScore = getSumScore(scores);

          results.push({
            name,
            sum: sumScore,
            median: medianScore,
            mean: meanScore,
            threshold,
            aggregation,
            scores: scoresWithName,
          });

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
    return await data();
  }
  return data;
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
