import type { ExperimentDatasetItem, VoltagentDataItem } from './types';

/**
 * Map a VoltAgent ExperimentDatasetItem to a Viteval DataItem.
 *
 * @example
 * ```ts
 * const voltItem = { id: '1', input: 'Hello', expected: 'Hi', label: 'Greeting' };
 * const vitevalItem = mapVoltagentItem(voltItem);
 * // { input: 'Hello', expected: 'Hi', name: 'Greeting', id: '1', ... }
 * ```
 *
 * @param item - VoltAgent dataset item
 * @returns Viteval-compatible data item
 */
export function mapVoltagentItem<INPUT = unknown, OUTPUT = unknown>(
  item: ExperimentDatasetItem<INPUT, OUTPUT>
): VoltagentDataItem<INPUT, OUTPUT> {
  const { input, expected, label, extra, ...rest } = item;

  return {
    input,
    expected: (expected ?? input) as OUTPUT,
    name: label ?? undefined,
    id: rest.id,
    metadata: rest.metadata,
    datasetId: rest.datasetId,
    datasetVersionId: rest.datasetVersionId,
    datasetName: rest.datasetName,
    raw: rest.raw,
    ...extra,
  };
}

/**
 * Map an array of VoltAgent items to Viteval DataItems.
 *
 * @example
 * ```ts
 * const voltItems = await client.listDatasetItems(...);
 * const vitevalItems = mapVoltagentItems(voltItems);
 * ```
 *
 * @param items - Array of VoltAgent dataset items
 * @returns Array of Viteval-compatible data items
 */
export function mapVoltagentItems<INPUT = unknown, OUTPUT = unknown>(
  items: ExperimentDatasetItem<INPUT, OUTPUT>[]
): VoltagentDataItem<INPUT, OUTPUT>[] {
  return items.map((item) => mapVoltagentItem<INPUT, OUTPUT>(item));
}
