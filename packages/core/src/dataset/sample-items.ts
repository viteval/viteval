import type { DataGenerator, DataItem, SampleItemsParams } from '#/types';

/**
 * Create a data generator that samples N items by calling a single-item factory function.
 *
 * @param params - The sampling parameters.
 * @param params.item - Function that generates a single dataset item. Receives the current index (0-based).
 * @param params.count - Number of items to sample (must be >= 1).
 * @returns A `DataGenerator` compatible with `defineDataset` and `evaluate`.
 *
 * @example
 * ```ts
 * defineDataset({
 *   name: 'my-dataset',
 *   data: sampleItems({
 *     item: async (index) => ({ input: `prompt-${index}`, expected: '...' }),
 *     count: 20,
 *   }),
 * })
 * ```
 */
export function sampleItems<DATA_ITEM extends DataItem>(
  params: SampleItemsParams<DATA_ITEM>
): DataGenerator<DATA_ITEM> {
  const { item, count } = params;

  if (!Number.isSafeInteger(count) || count < 1) {
    throw new Error(
      `sampleItems: count must be a positive integer (>= 1), received ${count}`
    );
  }

  return async () => {
    const items: DATA_ITEM[] = [];

    for (let i = 0; i < count; i++) {
      items.push(await item(i));
    }

    return items;
  };
}
