import { findRoot } from '#/internals/utils';
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
declare global {
  // biome-ignore lint/style/noVar: globalThis requires var
  var __VITEVAL_DATASET_PROVIDER_REGISTRY__:
    | {
        create(
          type: string,
          config: Record<string, unknown>
        ): {
          fetch(options?: any): Promise<any[]>;
          exists(): Promise<boolean>;
        };
      }
    | undefined;
}

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

  let providerInstance: any | null = null;

  function getDataFunction(): DATA_FUNC {
    if (config.data) {
      return config.data;
    }

    if (config.provider) {
      if (!providerInstance) {
        const registry = globalThis.__VITEVAL_DATASET_PROVIDER_REGISTRY__;
        if (!registry) {
          throw new Error(
            `Provider '${config.provider}' not found. Make sure to import the provider package:\n\nimport '@viteval/${config.provider}'\n`
          );
        }
        providerInstance = registry.create(config.provider, config);
      }

      return (async () => providerInstance.fetch()) as DATA_FUNC;
    }

    throw new Error(
      'Either data or provider must be specified in dataset configuration.'
    );
  }

  return {
    name: config.name,
    storage: finalStorage,
    description: config.description,
    async exists() {
      if (finalStorage === 'memory') {
        return false;
      }

      const storage = createDatasetStorage<INPUT, OUTPUT, EXTRA>({
        name: config.name,
        root: await findRoot(process.cwd()),
        storage: finalStorage,
      });

      // Check cache first
      if (await storage.exists()) {
        return true;
      }

      // If using provider, check if dataset exists remotely
      if (config.provider) {
        if (!providerInstance) {
          const registry = globalThis.__VITEVAL_DATASET_PROVIDER_REGISTRY__;
          if (!registry) {
            throw new Error(
              `Provider '${config.provider}' not found. Make sure to import the provider package:\n\nimport '@viteval/${config.provider}'\n`
            );
          }
          providerInstance = registry.create(config.provider, config);
        }
        return providerInstance.exists();
      }

      return false;
    },
    async load(options) {
      const dataFunc = getDataFunction();

      if (finalStorage === 'memory') {
        return (await dataFunc()) as DATA_ITEM[];
      }

      const storage = createDatasetStorage<INPUT, OUTPUT, EXTRA>({
        name: config.name,
        root: await findRoot(process.cwd()),
        storage: finalStorage,
      });
      const data = await storage.load();

      if (options?.create === true && !data) {
        const newData = await dataFunc();
        await storage.save(newData as DATA_ITEM[]);
        return newData as DATA_ITEM[];
      }

      return data as DATA_ITEM[];
    },
    async save(options) {
      if (finalStorage === 'memory') {
        return;
      }

      const storage = createDatasetStorage<INPUT, OUTPUT, EXTRA>({
        name: config.name,
        root: await findRoot(process.cwd()),
        storage: finalStorage,
      });

      if (options?.overwrite !== true && (await storage.exists())) {
        return;
      }

      const dataFunc = getDataFunction();
      const data = await dataFunc();
      await storage.save(data as DATA_ITEM[]);
    },
    // @ts-expect-error - allowed, internal only
    ___viteval_type: 'dataset',
  };
}
