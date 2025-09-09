import { findRoot } from '#/internals/utils';
import type {
  DataGenerator,
  Dataset,
  DatasetConfig,
  InferDataInput,
  InferDataOutput,
} from '#/types';
import { createDatasetStorage } from './storage';

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
  type INPUT = InferDataInput<DATA_FUNC>;
  type OUTPUT = InferDataOutput<DATA_FUNC>;

  const finalStorage = config.storage ?? 'local';
  return {
    name: config.name,
    storage: finalStorage,
    async exists() {
      if (finalStorage === 'memory') {
        return false;
      }

      const storage = createDatasetStorage<INPUT, OUTPUT>({
        name: config.name,
        root: await findRoot(process.cwd()),
        storage: finalStorage,
      });
      return await storage.exists();
    },
    load: (async (options) => {
      if (finalStorage === 'memory') {
        return await config.data();
      }

      const storage = createDatasetStorage<INPUT, OUTPUT>({
        name: config.name,
        root: await findRoot(process.cwd()),
        storage: finalStorage,
      });
      const data = await storage.load();

      if (options?.create === true && !data) {
        const newData = await config.data();
        await storage.save(newData);
        return newData;
      }

      return data;
    }) as Dataset<DATA_FUNC>['load'],
    async save(options) {
      if (finalStorage === 'memory') {
        return;
      }

      const storage = createDatasetStorage<INPUT, OUTPUT>({
        name: config.name,
        root: await findRoot(process.cwd()),
        storage: finalStorage,
      });

      if (options?.overwrite !== true && (await storage.exists())) {
        return;
      }

      const data = await config.data();
      await storage.save(data);
    },
    // @ts-expect-error - allowed, internal only
    ___viteval_type: 'dataset',
  };
}
