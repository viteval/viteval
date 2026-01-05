import type { DataGenerator, Dataset } from '@viteval/core';
import { createDatasetStorage, findRoot } from '@viteval/core/dataset';
import { createVoltagentProvider, type VoltagentProvider } from './provider';
import type { VoltagentDataItem, VoltagentDatasetConfig } from './types';

/**
 * Define a dataset that fetches from VoltOps.
 *
 * This function creates a Dataset compatible with Viteval's evaluate() function
 * that pulls data from VoltOps using the VoltAgent SDK.
 *
 * @example
 * ```ts
 * import { defineVoltagentDataset } from '@viteval/voltagent';
 * import { evaluate, scorers } from 'viteval';
 *
 * // Define a dataset from VoltOps
 * const dataset = defineVoltagentDataset({
 *   name: 'my-evaluation-data',
 *   id: 'dataset-uuid-from-voltops',
 *   cache: 'local', // Cache locally for faster subsequent runs
 * });
 *
 * // Use in evaluation
 * evaluate('My Eval', {
 *   data: dataset,
 *   task: async ({ input }) => {
 *     // Your task implementation
 *     return result;
 *   },
 *   scorers: [scorers.exactMatch],
 * });
 * ```
 *
 * @example
 * ```ts
 * // Using dataset name instead of ID
 * const dataset = defineVoltagentDataset({
 *   name: 'customer-support-qa',
 *   limit: 100, // Only fetch first 100 items
 *   cache: 'none', // Always fetch fresh data
 * });
 * ```
 *
 * @param config - Dataset configuration
 * @returns A Dataset object compatible with Viteval's evaluate()
 */
export function defineVoltagentDataset<INPUT = unknown, OUTPUT = unknown>(
  config: VoltagentDatasetConfig
): Dataset<
  DataGenerator<VoltagentDataItem<INPUT, OUTPUT>>,
  VoltagentDataItem<INPUT, OUTPUT>
> {
  const cacheStrategy = config.cache ?? 'local';

  // Lazily initialized provider
  let providerPromise: Promise<VoltagentProvider<INPUT, OUTPUT>> | null = null;

  function getProvider(): Promise<VoltagentProvider<INPUT, OUTPUT>> {
    if (!providerPromise) {
      providerPromise = createVoltagentProvider<INPUT, OUTPUT>({
        type: 'voltagent',
        datasetId: config.id,
        datasetName: config.name,
        versionId: config.versionId,
        auth: config.auth,
      });
    }
    return providerPromise;
  }

  // Cache key includes name and optional version for uniqueness
  const cacheKey = `voltagent-${config.name}${config.versionId ? `-${config.versionId}` : ''}`;

  return {
    name: config.name,
    storage: cacheStrategy === 'none' ? 'memory' : 'local',
    description: config.description,

    async exists(): Promise<boolean> {
      // Check local cache first (if caching enabled)
      if (cacheStrategy === 'local') {
        const storage = createDatasetStorage({
          name: cacheKey,
          root: await findRoot(process.cwd()),
          storage: 'local',
        });

        if (await storage.exists()) {
          return true;
        }
      }

      // Check remote
      const provider = await getProvider();
      return provider.exists();
    },

    load: async (_options) => {
      // Try cache first (unless cache is 'none')
      if (cacheStrategy === 'local') {
        const storage = createDatasetStorage({
          name: cacheKey,
          root: await findRoot(process.cwd()),
          storage: 'local',
        });

        const cached = await storage.load();
        if (cached) {
          return cached as VoltagentDataItem<INPUT, OUTPUT>[];
        }
      }

      // Fetch from VoltOps
      const provider = await getProvider();
      const items = await provider.fetch({ limit: config.limit });

      // Cache locally if enabled
      if (cacheStrategy === 'local' && items.length > 0) {
        const storage = createDatasetStorage({
          name: cacheKey,
          root: await findRoot(process.cwd()),
          storage: 'local',
        });
        await storage.save(items as VoltagentDataItem<INPUT, OUTPUT>[]);
      }

      return items;
    },

    async save(_options?: { overwrite?: boolean }): Promise<void> {
      // VoltAgent datasets are read-only - save is a no-op
      // Upload functionality could be added here when VoltOps API supports it
    },

    // Internal marker for isDataset() detection
    ___viteval_type: 'dataset' as const,
  } as Dataset<
    DataGenerator<VoltagentDataItem<INPUT, OUTPUT>>,
    VoltagentDataItem<INPUT, OUTPUT>
  >;
}
