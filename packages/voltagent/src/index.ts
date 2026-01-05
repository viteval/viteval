/**
 * @viteval/voltagent - VoltAgent dataset integration for Viteval
 *
 * This package provides integration with VoltOps for fetching evaluation datasets.
 *
 * @example
 * ```ts
 * import { defineVoltagentDataset } from '@viteval/voltagent';
 * import { evaluate, scorers } from 'viteval';
 *
 * const dataset = defineVoltagentDataset({
 *   name: 'my-evaluation-data',
 *   id: 'dataset-uuid-from-voltops',
 *   cache: 'local',
 * });
 *
 * evaluate('My Eval', {
 *   data: dataset,
 *   task: async ({ input }) => result,
 *   scorers: [scorers.exactMatch],
 * });
 * ```
 *
 * @packageDocumentation
 */

export { createVoltagentClient, type VoltagentClient } from './client';
export { defineVoltagentDataset } from './dataset';
export { mapVoltagentItem, mapVoltagentItems } from './mapper';
export { createVoltagentProvider, type VoltagentProvider } from './provider';
export type {
  ExperimentDatasetItem,
  VoltagentAuthConfig,
  VoltagentDataItem,
  VoltagentDatasetConfig,
  VoltagentExtra,
  VoltagentProviderConfig,
} from './types';
