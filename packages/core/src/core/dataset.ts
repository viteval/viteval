import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createFile } from '@viteval/internal';
import { findRoot } from '#/internals/utils';
import type {
  DataGenerator,
  DataItem,
  Dataset,
  DatasetConfig,
  DatasetStorage,
} from '#/types';

/**
 * Define a dataset.
 *
 * @example
 * ```ts
 * const dataset = defineDataset({
 *   name: 'color-questions',
 *   data: async () => {
 *     const results = [];
 *     for (let i = 0; i < 100; i++) {
 *       const { object: result} = await generateObject('Create a question and answer for the color of objects, such as "What is the color of the sky?" => "The sky is blue."', {
 *         model: openai('gpt-4o'),
 *         schema: z.object({
 *           question: z.string(),
 *           answer: z.string(),
 *         }),
 *       });
 *
 *       results.push({
 *         input: result.question,
 *         expected: result.answer,
 *       });
 *     }
 *     return results;
 *   },
 * });
 * ```
 *
 * @param config - The configuration of the dataset.
 * @returns The dataset.
 */
export function defineDataset<DATA_FUNC extends DataGenerator>(
  config: DatasetConfig<DATA_FUNC>
): Dataset<DATA_FUNC> {
  const finalStorage = config.storage ?? 'local';
  return {
    name: config.name,
    storage: finalStorage,
    data: (async () => {
      const existingDataset = await loadDataset({
        name: config.name,
        storage: finalStorage,
      });

      if (existingDataset) {
        return existingDataset;
      }

      const result = await config.data();

      if (finalStorage === 'local') {
        await saveDataset({
          name: config.name,
          storage: finalStorage,
          data: result,
        });
      }

      return result;
    }) as DATA_FUNC,
    // @ts-expect-error - allowed, internal only
    ___viteval_type: 'dataset',
  };
}

/**
 * Save a dataset to a file.
 *
 * @param payload - The payload of the dataset.
 * @returns The dataset.
 */
export async function saveDataset(payload: {
  name: string;
  storage: DatasetStorage;
  data: DataItem<unknown, unknown>[];
}) {
  const { name, storage, data } = payload;

  const root = await findRoot(process.cwd());

  if (storage === 'local') {
    const filePath = getDatasetPath(root, name);
    await createFile(filePath, JSON.stringify(data, null, 2));
  } else {
    throw new Error(`Unsupported storage type: ${storage}`);
  }
}

/**
 * Load a dataset from a file.
 *
 * @param payload - The payload of the dataset.
 * @returns The dataset.
 */
export async function loadDataset(payload: {
  name: string;
  storage: DatasetStorage;
}): Promise<DataItem<unknown, unknown>[] | null> {
  const { name, storage } = payload;
  const root = await findRoot(process.cwd());

  if (storage === 'local') {
    const filePath = getDatasetPath(root, name);
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data);
  }

  throw new Error(`Unsupported storage type: ${storage}`);
}

/*
|------------------
| Internals
|------------------
*/

function getDatasetPath(root: string, name: string) {
  return path.join(root, '.viteval', 'datasets', `${name}.json`);
}
