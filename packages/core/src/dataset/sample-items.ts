import { err, ok, type Result } from 'massaman/control';
import { mapAsync } from 'massaman/array';
import type { DataGenerator, DataItem, SampleItemsParams } from '#/types';

/**
 * Create a data generator that samples N items by calling a single-item factory function.
 *
 * @param params - The sampling parameters.
 * @param params.item - Function that generates a single dataset item. Receives the current index (0-based).
 * @param params.count - Number of items to sample (must be >= 1).
 * @returns A `DataGenerator`, or an error when count is invalid.
 *
 * @example
 * ```ts
 * const sampled = sampleItems({
 *   item: async (index) => ({ input: `prompt-${index}`, expected: '...' }),
 *   count: 20,
 * });
 *
 * if (sampled.ok) {
 *   defineDataset({ name: 'my-dataset', data: sampled.value });
 * }
 * ```
 */
export function sampleItems<DATA_ITEM extends DataItem>(
  params: SampleItemsParams<DATA_ITEM>
): Result<DataGenerator<DATA_ITEM>> {
  const { item, count } = params;

  if (!Number.isSafeInteger(count) || count < 1) {
    return err(
      `sampleItems: count must be a positive integer (>= 1), received ${count}`
    );
  }

  return ok(() =>
    mapAsync(
      Array.from({ length: count }, (_, index) => index),
      async (index) => item(index),
      { concurrency: 1 }
    )
  );
}
