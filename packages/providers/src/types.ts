import type { DataItem, Extra } from '@viteval/core';

/**
 * Options for fetching data from a provider.
 */
export interface ProviderFetchOptions {
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
 * A dataset provider that fetches data from a remote source.
 *
 * @example
 * ```ts
 * const provider: Provider = {
 *   type: 'voltagent',
 *   config: { datasetId: 'abc123' },
 *   async fetch(options) {
 *     // Fetch from remote API
 *     return items;
 *   },
 *   async exists() {
 *     return true;
 *   },
 * };
 * ```
 */
export interface Provider<
  CONFIG = any,
  INPUT = unknown,
  OUTPUT = unknown,
  EXTRA extends Extra = Extra,
> {
  /**
   * Provider type identifier.
   */
  readonly type: string;

  /**
   * Provider configuration.
   */
  readonly config: CONFIG;

  /**
   * Fetch dataset items from the remote source.
   *
   * @param options - Fetch options
   * @returns Array of data items
   */
  fetch(
    options?: ProviderFetchOptions
  ): Promise<DataItem<INPUT, OUTPUT, EXTRA>[]>;

  /**
   * Check if the dataset exists in the remote source.
   *
   * @returns True if the dataset exists
   */
  exists(): Promise<boolean>;

  /**
   * Upload dataset items to the remote source (optional).
   *
   * @param items - Items to upload
   */
  upload?(items: DataItem<INPUT, OUTPUT, EXTRA>[]): Promise<void>;
}

/**
 * Factory function that creates a provider instance.
 * Accepts a dataset configuration object and extracts provider-specific fields.
 *
 * @param config - Full dataset configuration object
 * @returns Provider instance
 */
export type ProviderFactory = (
  config: Record<string, unknown>
) => Promise<Provider>;

/**
 * Metadata about a registered provider.
 */
export interface ProviderMetadata {
  /**
   * Provider type identifier (e.g., 'voltagent', 'braintrust').
   */
  type: string;

  /**
   * Package name to install (e.g., '@viteval/voltagent').
   */
  packageName: string;

  /**
   * Factory function to create provider instances.
   */
  factory: ProviderFactory;

  /**
   * Optional description of what this provider does.
   */
  description?: string;
}
