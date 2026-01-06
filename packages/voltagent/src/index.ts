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

registerProvider({
  type: 'voltagent',
  packageName: '@viteval/voltagent',
  factory: (config: Record<string, unknown>) => {
    const voltagentConfig = {
      type: 'voltagent' as const,
      datasetId: config.datasetId as string | undefined,
      datasetName: config.datasetName as string | undefined,
      versionId: config.versionId as string | undefined,
      auth: config.auth as any,
    };

    let clientPromise: Promise<any> | null = null;
    let resolvedIdentifiers: any | null = null;

    return {
      type: 'voltagent',
      config: voltagentConfig,

      async fetch(options?: any) {
        if (!clientPromise) {
          clientPromise = (async () => {
            const { createVoltagentClient } = await import('./client');
            return createVoltagentClient({ auth: voltagentConfig.auth });
          })();
        }

        const client = await clientPromise;

        if (!resolvedIdentifiers) {
          resolvedIdentifiers = await client.resolveDatasetIdentifiers({
            name: voltagentConfig.datasetName,
            id: voltagentConfig.datasetId,
            versionId: voltagentConfig.versionId,
          });
        }

        const { datasetId, versionId } = resolvedIdentifiers;
        const items = await client.listDatasetItems(datasetId, versionId, {
          limit: options?.limit,
          offset: options?.offset,
        });

        const { mapVoltagentItems } = await import('./mapper');
        return mapVoltagentItems(items);
      },

      async exists() {
        if (!clientPromise) {
          clientPromise = (async () => {
            const { createVoltagentClient } = await import('./client');
            return createVoltagentClient({ auth: voltagentConfig.auth });
          })();
        }

        const client = await clientPromise;
        return client.datasetExists({
          name: voltagentConfig.datasetName,
          id: voltagentConfig.datasetId,
        });
      },
    };
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
