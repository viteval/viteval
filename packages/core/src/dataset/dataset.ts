import { attemptAsync, isErr, ok, type Result } from 'massaman/control';
import type {
  DataGenerator,
  DataItem,
  Dataset,
  DatasetConfig,
  Extra,
  InferDataExtra,
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
export function defineDataset<
  DATA_FUNC extends DataGenerator,
  INPUT = InferDataInput<DATA_FUNC>,
  OUTPUT = InferDataOutput<DATA_FUNC>,
  EXTRA extends Extra = InferDataExtra<DATA_FUNC>,
  DATA_ITEM extends DataItem<INPUT, OUTPUT, EXTRA> = DataItem<
    INPUT,
    OUTPUT,
    EXTRA
  >,
>(config: DatasetConfig<DATA_FUNC>): Dataset<DATA_FUNC, DATA_ITEM> {
  const finalStorage = config.storage ?? 'local';
  const dataset: Dataset<DATA_FUNC, DATA_ITEM> = {
    name: config.name,
    description: config.description,
    storage: finalStorage,
    async exists() {
      if (finalStorage === 'memory') {
        return ok(false);
      }

      const storage = createDatasetStorage<INPUT, OUTPUT, EXTRA>({
        description: config.description,
        name: config.name,
        root: process.cwd(),
        storage: finalStorage,
      });
      return await storage.exists();
    },
    async load(options) {
      if (finalStorage === 'memory') {
        return await attemptAsync(
          async () => (await config.data()) as DATA_ITEM[]
        );
      }

      const storage = createDatasetStorage<INPUT, OUTPUT, EXTRA>({
        description: config.description,
        name: config.name,
        root: process.cwd(),
        storage: finalStorage,
      });
      const result = (await storage.load()) as Result<DATA_ITEM[] | null>;
      if (isErr(result)) {
        return result;
      }

      if (options?.create === true && !result.value) {
        const generated = await attemptAsync(
          async () => (await config.data()) as DATA_ITEM[]
        );
        if (isErr(generated)) {
          return generated;
        }
        const saved = await storage.save(generated.value);
        return isErr(saved) ? saved : generated;
      }

      return result;
    },
    async save(options) {
      if (finalStorage === 'memory') {
        return ok(undefined);
      }

      const storage = createDatasetStorage<INPUT, OUTPUT, EXTRA>({
        description: config.description,
        name: config.name,
        root: process.cwd(),
        storage: finalStorage,
      });

      const exists = await storage.exists();
      if (isErr(exists)) {
        return exists;
      }
      if (options?.overwrite !== true && exists.value) {
        return ok(undefined);
      }

      const data = await attemptAsync(
        async () => (await config.data()) as DATA_ITEM[]
      );
      return isErr(data) ? data : await storage.save(data.value);
    },
  };
  globalThis.__viteval_datasetDiscovery?.register(dataset);
  return dataset;
}
