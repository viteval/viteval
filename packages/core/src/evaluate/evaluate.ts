import { hasKey, isObject } from '@viteval/internal';
import { match } from 'ts-pattern';
import { afterAll, assert, beforeAll, describe, test } from 'vitest';
import { getRuntimeConfig } from '#/internals/config';
import { resolve } from '#/internals/utils';
import { initializeProvider } from '#/provider/initialize';
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
    timeout,
  }: Eval<DATA>
) {
  return describe(name, async () => {
    const results: EvalResult[] = [];
    const config = getRuntimeConfig();

    beforeAll(async () => {
      initializeProvider(config.provider); 
    });

    afterAll((suite) => {
      // @ts-expect-error - this is valid
      suite.meta.results = results;
    });

    const formattedData = await formatData(data);

    for (const dataItem of formattedData) {
      const { input, ...params } = dataItem;
      const name = formatTestName(dataItem);
      test(
        formatTestName(dataItem),
        {
          timeout: timeout ?? config.eval?.timeout ?? 25000,
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
                input,
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

          const {
            input: _input,
            expected: _expected,
            output: _output,
            ...metadata
          } = params;

          results.push({
            name,
            sum: sumScore,
            median: medianScore,
            mean: meanScore,
            threshold,
            aggregation,
            scores: scoresWithName,
            input: dataItem.input,
            expected: dataItem.expected,
            output: taskResult,
            metadata,
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
    const d = await data();
    return d as DATA_ITEM[];
  }

  if (isDataset(data)) {
    const d = await data.load({ create: true });
    return d as DATA_ITEM[];
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
