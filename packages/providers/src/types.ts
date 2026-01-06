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

export interface DatasetProvider<
  CONFIG = any,
  INPUT = unknown,
  OUTPUT = unknown,
  EXTRA extends Extra = Extra,
> {
  readonly type: string;
  readonly config: CONFIG;

  fetch(
    options?: ProviderFetchOptions
  ): Promise<DataItem<INPUT, OUTPUT, EXTRA>[]>;

  exists(): Promise<boolean>;

  upload?(items: DataItem<INPUT, OUTPUT, EXTRA>[]): Promise<void>;
}

export type DatasetProviderFactory = (
  config: Record<string, unknown>
) => DatasetProvider;

export interface DatasetProviderMetadata {
  type: string;
  packageName: string;
  factory: DatasetProviderFactory;
  description?: string;
}

export type Provider = DatasetProvider;
export type ProviderFactory = DatasetProviderFactory;
export type ProviderMetadata = DatasetProviderMetadata;
