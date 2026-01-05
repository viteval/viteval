import type {
  DatasetProvider,
  DatasetProviderFetchOptions,
} from '@viteval/core/dataset';
import {
  createVoltagentClient,
  type ResolvedDatasetIdentifiers,
} from './client';
import { mapVoltagentItems } from './mapper';
import type {
  VoltagentDataItem,
  VoltagentExtra,
  VoltagentProviderConfig,
} from './types';

/**
 * VoltAgent dataset provider implementation.
 */
export type VoltagentProvider<
  INPUT = unknown,
  OUTPUT = unknown,
> = DatasetProvider<VoltagentProviderConfig, INPUT, OUTPUT, VoltagentExtra>;

/**
 * Create a VoltAgent dataset provider.
 *
 * This provider fetches datasets from VoltOps using the @voltagent/sdk.
 *
 * @example
 * ```ts
 * const provider = await createVoltagentProvider({
 *   type: 'voltagent',
 *   datasetId: 'my-dataset-id',
 * });
 *
 * const items = await provider.fetch();
 * ```
 *
 * @param config - Provider configuration
 * @returns DatasetProvider instance
 */
export async function createVoltagentProvider<
  INPUT = unknown,
  OUTPUT = unknown,
>(config: VoltagentProviderConfig): Promise<VoltagentProvider<INPUT, OUTPUT>> {
  const client = await createVoltagentClient({ auth: config.auth });

  // Cache for resolved identifiers to avoid repeated API calls
  let resolvedIdentifiers: ResolvedDatasetIdentifiers | null = null;

  async function getIdentifiers(): Promise<ResolvedDatasetIdentifiers> {
    if (resolvedIdentifiers) {
      return resolvedIdentifiers;
    }

    resolvedIdentifiers = await client.resolveDatasetIdentifiers({
      name: config.datasetName,
      id: config.datasetId,
      versionId: config.versionId,
    });

    return resolvedIdentifiers;
  }

  return {
    type: 'voltagent',
    config,

    async fetch(
      options?: DatasetProviderFetchOptions
    ): Promise<VoltagentDataItem<INPUT, OUTPUT>[]> {
      const { datasetId, versionId } = await getIdentifiers();

      const items = await client.listDatasetItems<INPUT, OUTPUT>(
        datasetId,
        versionId,
        {
          limit: options?.limit,
          offset: options?.offset,
        }
      );

      return mapVoltagentItems<INPUT, OUTPUT>(items);
    },

    async exists(): Promise<boolean> {
      return client.datasetExists({
        name: config.datasetName,
        id: config.datasetId,
      });
    },

    // Upload is not currently supported by VoltOps public API
    // This can be implemented when the API supports it
    // async upload(items: VoltagentDataItem<INPUT, OUTPUT>[]): Promise<void> {
    //   throw new Error('Upload not yet supported for VoltAgent datasets');
    // },
  };
}
