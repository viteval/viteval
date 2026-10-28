import { attemptAsync, isErr } from 'massaman/control';
import { getProjectRuntime, getRuntimeContext } from '#/config/runtime';
import { getExecutionScope } from '#/config/execution';
import type {
  DataItem,
  Dataset,
  DatasetConfig,
  DatasetData,
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
  DATA_FUNC extends DatasetData,
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
  async function storages() {
    if (finalStorage === 'memory') {
      return [];
    }
    const runtime = getProjectRuntime();
    if (!runtime) {
      if (config.providers?.length) {
        throw new Error(
          'Dataset destinations require a Viteval project configuration'
        );
      }
      return config.providers
        ? []
        : [
            createDatasetStorage<INPUT, OUTPUT, EXTRA>({
              description: config.description,
              name: config.name,
              root: process.cwd(),
              storage: 'local',
            }),
          ];
    }
    return Promise.all(
      runtime.datasetNames(config.providers).map(async (name) => {
        const provider = await runtime.provider(name);
        if (!provider.datasets) {
          throw new Error(`Provider "${name}" does not support datasets`);
        }
        return createDatasetStorage<INPUT, OUTPUT, EXTRA>({
          description: config.description,
          name: config.name,
          provider: provider.datasets,
          root: runtime.config.root ?? process.cwd(),
          storage: 'local',
        });
      })
    );
  }
  async function generate(): Promise<DATA_ITEM[]> {
    const data =
      typeof config.data === 'function'
        ? await config.data(getRuntimeContext())
        : config.data;
    // The declaration's generator/array establishes this dataset's item shape.
    return data as DATA_ITEM[];
  }
  const dataset: Dataset<DATA_FUNC, DATA_ITEM> = {
    description: config.description,
    async exists() {
      return attemptAsync(async () => {
        const destinations = await storages();
        if (!destinations.length) return false;
        const results = await Promise.all(
          destinations.map((storage) => storage.exists())
        );
        const failed = results.find(isErr);
        if (failed) throw failed.error;
        return results.every((result) => result.ok && result.value);
      });
    },
    async load(options) {
      return attemptAsync(async () => {
        const destinations = await storages();
        if (!destinations.length) return generate();
        if (destinations.length > 1)
          throw new Error(
            `Dataset "${config.name}" has multiple destinations. Select a read source with data: ({ json }) => json.dataset('${config.name}')`
          );
        const loaded = await destinations[0].load();
        if (isErr(loaded)) throw loaded.error;
        if (loaded.value || !options?.create)
          return loaded.value as DATA_ITEM[] | null;
        const data = await generate();
        const saved = await destinations[0].save(data);
        if (isErr(saved)) throw saved.error;
        return data;
      });
    },
    name: config.name,
    async save(options) {
      return attemptAsync(async () => {
        const destinations = await storages();
        const missing = await Promise.all(
          destinations.map(async (storage) => {
            const exists = await storage.exists();
            if (isErr(exists)) throw exists.error;
            return options?.overwrite || !exists.value ? storage : null;
          })
        );
        const selected = missing.filter((storage) => storage !== null);
        if (destinations.length && !selected.length) return;
        const data = await generate();
        const saved = await Promise.all(
          selected.map(async (storage) => {
            const result = await attemptAsync(() => storage.save(data));
            return isErr(result) ? result : result.value;
          })
        );
        const failures = saved.filter(isErr);
        if (failures.length)
          throw new AggregateError(
            failures.map((result) => result.error),
            `Failed to save dataset "${config.name}": ${failures.map((result) => result.error.message).join('; ')}`
          );
      });
    },
    storage: finalStorage,
  };
  getExecutionScope()?.discovery?.register(dataset);
  return dataset;
}
