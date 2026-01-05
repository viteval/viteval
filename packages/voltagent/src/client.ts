import type { VoltOpsRestClient } from '@voltagent/sdk';
import type { ExperimentDatasetItem, VoltagentAuthConfig } from './types';

/**
 * Default page size for paginated requests.
 */
const DEFAULT_PAGE_SIZE = 200;

/**
 * Get authentication configuration from environment variables.
 *
 * @returns Auth config from environment
 */
function getAuthFromEnv(): VoltagentAuthConfig {
  return {
    apiKey: process.env.VOLTOPS_API_KEY,
    baseUrl: process.env.VOLTOPS_BASE_URL,
  };
}

/**
 * Merge auth configuration with environment defaults.
 *
 * @param config - User-provided auth config
 * @returns Merged auth config
 */
function resolveAuth(
  config?: VoltagentAuthConfig
): Required<Pick<VoltagentAuthConfig, 'apiKey'>> & VoltagentAuthConfig {
  const envAuth = getAuthFromEnv();
  const merged = { ...envAuth, ...config };

  if (!merged.apiKey) {
    throw new Error(
      'VoltOps API key not found. Set VOLTOPS_API_KEY environment variable or provide auth.apiKey in config.'
    );
  }

  return merged as Required<Pick<VoltagentAuthConfig, 'apiKey'>> &
    VoltagentAuthConfig;
}

/**
 * Options for creating a VoltAgent client.
 */
export interface CreateVoltagentClientOptions {
  /**
   * Authentication configuration.
   */
  auth?: VoltagentAuthConfig;
}

/**
 * Options for listing dataset items.
 */
export interface ListDatasetItemsOptions {
  /**
   * Maximum number of items to fetch.
   */
  limit?: number;

  /**
   * Offset for pagination.
   */
  offset?: number;
}

/**
 * Resolved dataset identifiers.
 */
export interface ResolvedDatasetIdentifiers {
  /**
   * The dataset ID.
   */
  datasetId: string;

  /**
   * The dataset version ID.
   */
  versionId: string;

  /**
   * The dataset name.
   */
  name: string;
}

/**
 * VoltAgent client interface for interacting with VoltOps.
 */
export interface VoltagentClient {
  /**
   * The underlying VoltOps SDK client.
   */
  readonly sdk: VoltOpsRestClient;

  /**
   * Resolve dataset identifiers from name or ID.
   *
   * @param params - Parameters for resolving
   * @returns Resolved identifiers
   */
  resolveDatasetIdentifiers(params: {
    name?: string;
    id?: string;
    versionId?: string;
  }): Promise<ResolvedDatasetIdentifiers>;

  /**
   * List items from a dataset with pagination.
   *
   * @param datasetId - The dataset ID
   * @param versionId - The version ID
   * @param options - Pagination options
   * @returns Array of dataset items
   */
  listDatasetItems<INPUT = unknown, OUTPUT = unknown>(
    datasetId: string,
    versionId: string,
    options?: ListDatasetItemsOptions
  ): Promise<ExperimentDatasetItem<INPUT, OUTPUT>[]>;

  /**
   * Check if a dataset exists.
   *
   * @param params - Parameters for checking
   * @returns True if the dataset exists
   */
  datasetExists(params: { name?: string; id?: string }): Promise<boolean>;
}

/**
 * Create a VoltAgent client for interacting with VoltOps.
 *
 * @example
 * ```ts
 * // Using environment variables
 * const client = await createVoltagentClient();
 *
 * // With explicit auth
 * const client = await createVoltagentClient({
 *   auth: { apiKey: 'my-api-key' }
 * });
 * ```
 *
 * @param options - Client options
 * @returns VoltAgent client instance
 */
export async function createVoltagentClient(
  options?: CreateVoltagentClientOptions
): Promise<VoltagentClient> {
  const auth = resolveAuth(options?.auth);

  // Dynamically import @voltagent/sdk to support peer dependency
  const { VoltOpsRestClient } = await import('@voltagent/sdk');

  const sdk = new VoltOpsRestClient({
    publicKey: auth.apiKey,
    baseUrl: auth.baseUrl,
  });

  // Helper function to resolve dataset identifiers
  async function resolveDatasetIdentifiers(params: {
    name?: string;
    id?: string;
    versionId?: string;
  }): Promise<ResolvedDatasetIdentifiers> {
    const { name, id, versionId } = params;

    if (!name && !id) {
      throw new Error('Either dataset name or id must be provided');
    }

    // Resolve version ID if not provided
    let resolvedVersionId = versionId;
    if (!resolvedVersionId) {
      const versionResult = await sdk.resolveDatasetVersionId({
        datasetId: id,
        datasetName: name,
      });
      // Handle various return types from the SDK
      if (typeof versionResult === 'string') {
        resolvedVersionId = versionResult;
      } else if (versionResult && typeof versionResult === 'object') {
        resolvedVersionId =
          'datasetVersionId' in versionResult
            ? (versionResult.datasetVersionId as string)
            : ((versionResult as { id?: string }).id ?? id ?? '');
      } else {
        throw new Error('Failed to resolve dataset version ID');
      }
    }

    // Get dataset metadata
    const datasetId = id ?? resolvedVersionId;
    const dataset = await sdk.getDataset(datasetId);

    return {
      datasetId: dataset?.id ?? datasetId,
      versionId: resolvedVersionId,
      name: dataset?.name ?? name ?? datasetId,
    };
  }

  // Helper function to list dataset items with pagination
  async function listDatasetItems<INPUT = unknown, OUTPUT = unknown>(
    datasetId: string,
    versionId: string,
    listOptions?: ListDatasetItemsOptions
  ): Promise<ExperimentDatasetItem<INPUT, OUTPUT>[]> {
    const limit = listOptions?.limit;
    const offset = listOptions?.offset ?? 0;
    const items: ExperimentDatasetItem<INPUT, OUTPUT>[] = [];

    let currentOffset = offset;
    let hasMore = true;

    while (hasMore) {
      const pageSize = limit
        ? Math.min(DEFAULT_PAGE_SIZE, limit - items.length)
        : DEFAULT_PAGE_SIZE;

      const page = await sdk.listDatasetItems(datasetId, versionId, {
        limit: pageSize,
        offset: currentOffset,
      });

      items.push(...(page.items as ExperimentDatasetItem<INPUT, OUTPUT>[]));
      currentOffset += page.items.length;

      // Check if we should continue fetching
      hasMore = page.items.length === pageSize;
      if (limit && items.length >= limit) {
        hasMore = false;
      }
    }

    return limit ? items.slice(0, limit) : items;
  }

  return {
    sdk,
    resolveDatasetIdentifiers,
    listDatasetItems,

    async datasetExists(params) {
      try {
        await resolveDatasetIdentifiers(params);
        return true;
      } catch {
        return false;
      }
    },
  };
}
