import { type Result, err, isErr, ok } from 'massaman/control';
import { getDatasetProvider } from '#/provider/client';
import { createJsonProvider } from '#/provider/json';
import type { DataItem, Extra } from '#/types';
import type { DatasetProvider } from '#/provider/types';

export interface DatasetStorageConfig {
  description?: string;
  name: string;
  root: string;
  storage: 'local';
  provider?: DatasetProvider;
}

/**
 * Create a dataset storage
 * @param payload - The payload for the dataset storage
 * @returns The dataset storage
 */
export function createDatasetStorage<INPUT, OUTPUT, EXTRA extends Extra>(
  payload: DatasetStorageConfig
) {
  const { name, root } = payload,
    provider =
      payload.provider ??
      getDatasetProvider() ??
      createJsonProvider({ root }).datasets;
  if (!provider) {
    throw new Error('Dataset provider is unavailable');
  }
  return {
    /**
     * Check if the dataset exists in the storage
     * @returns True if the dataset exists, false otherwise
     */
    async exists(): Promise<Result<boolean>> {
      const result = await provider.get({ name });
      return isErr(result) ? result : ok(result.value !== null);
    },
    /**
     * Load the dataset from the storage
     * @returns The dataset
     */
    async load(): Promise<Result<DataItem<INPUT, OUTPUT, EXTRA>[] | null>> {
      const dataset = await provider.get({ name });
      if (isErr(dataset)) return dataset;
      if (!dataset.value) return ok(null);
      const items = await provider.getItems({ datasetId: dataset.value.id });
      if (isErr(items)) return items;
      // The dataset's generator supplies its generic shape; provider storage is type-erased.
      return ok(
        items.value.map(({ input, expected, extra }) => ({
          ...extra,
          input,
          expected,
        })) as DataItem<INPUT, OUTPUT, EXTRA>[]
      );
    },
    /**
     * Save the dataset to the storage
     * @param data - The dataset to save
     */
    async save(data: DataItem<INPUT, OUTPUT, EXTRA>[]): Promise<Result<void>> {
      const existing = await provider.get({ name });
      if (isErr(existing)) return existing;
      const items = data.map(({ input, expected, ...extra }) => ({
        input,
        expected,
        extra,
      }));
      if (existing.value) {
        if (!provider.replaceItems)
          return err(`Provider cannot overwrite dataset ${name}`);
        return provider.replaceItems({ datasetId: existing.value.id, items });
      }
      const created = await provider.create({
        name,
        items,
        description: payload.description,
      });
      return isErr(created) ? created : ok(undefined);
    },
  };
}
