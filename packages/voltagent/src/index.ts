/**
 * @viteval/voltagent - VoltAgent dataset integration for Viteval
 *
 * This package provides integration with VoltOps for fetching evaluation datasets.
 *
 * @example
 * ```ts
 * import { defineDataset } from 'viteval/dataset';
 * import '@viteval/voltagent'; // Auto-registers provider
 * import { evaluate, scorers } from 'viteval';
 *
 * const dataset = defineDataset({
 *   name: 'my-evaluation-data',
 *   provider: 'voltagent',
 *   datasetId: 'dataset-uuid-from-voltops',
 *   storage: 'local',
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

import { registerProvider } from '@viteval/providers';
import { createVoltagentProvider } from './provider';

// Auto-register the voltagent provider when this package is imported
registerProvider({
  type: 'voltagent',
  packageName: '@viteval/voltagent',
  factory: async (config: Record<string, unknown>) => {
    // Extract VoltAgent-specific fields from dataset config
    const voltagentConfig = {
      type: 'voltagent' as const,
      datasetId: config.datasetId as string | undefined,
      datasetName: config.datasetName as string | undefined,
      versionId: config.versionId as string | undefined,
      auth: config.auth as any,
    };
    return createVoltagentProvider(voltagentConfig);
  },
  description: 'VoltAgent dataset integration - fetch datasets from VoltOps',
});

// Exports
export { createVoltagentClient, type VoltagentClient } from './client';
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
