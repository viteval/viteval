import type { DataItem } from '#/types';

/** Integrations augment this interface with their supported storage domains. */
export interface ProviderRegistry {
  json: { datasets: true; results: true };
}

export type DatasetProviderName = {
  [K in keyof ProviderRegistry]: ProviderRegistry[K] extends { datasets: true }
    ? K
    : never;
}[keyof ProviderRegistry] &
  string;

export type ResultProviderName = {
  [K in keyof ProviderRegistry]: ProviderRegistry[K] extends { results: true }
    ? K
    : never;
}[keyof ProviderRegistry] &
  string;

/** A provider-backed read; selecting it never generates or saves cases. */
export interface DatasetReference<ITEM extends DataItem = DataItem> {
  readonly name: string;
  load(): Promise<ITEM[]>;
}

/** Dataset handles exposed directly in evaluation and generator callbacks. */
export interface DatasetHandle {
  dataset<ITEM extends DataItem = DataItem>(
    name: string
  ): DatasetReference<ITEM>;
}
