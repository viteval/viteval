import type {
  DatasetProvider,
  DatasetProviderMetadata,
} from './types';
import {
  ProviderAlreadyRegisteredError,
  ProviderNotFoundError,
} from './errors';

declare global {
  // biome-ignore lint/style/noVar: globalThis requires var
  var __VITEVAL_DATASET_PROVIDER_REGISTRY__: DatasetProviderRegistry | undefined;
}

class DatasetProviderRegistry {
  private providers = new Map<string, DatasetProviderMetadata>();

  register(metadata: DatasetProviderMetadata): void {
    if (this.providers.has(metadata.type)) {
      throw new ProviderAlreadyRegisteredError(metadata.type);
    }
    this.providers.set(metadata.type, metadata);
  }

  has(type: string): boolean {
    return this.providers.has(type);
  }

  get(type: string): DatasetProviderMetadata | undefined {
    return this.providers.get(type);
  }

  list(): DatasetProviderMetadata[] {
    return Array.from(this.providers.values());
  }

  create(
    providerType: string,
    datasetConfig: Record<string, unknown>
  ): DatasetProvider {
    const metadata = this.get(providerType);

    if (!metadata) {
      const packageName = `@viteval/${providerType}`;
      throw new ProviderNotFoundError(providerType, packageName);
    }

    return metadata.factory(datasetConfig);
  }
}

function getGlobalDatasetProviderRegistry(): DatasetProviderRegistry {
  const globalKey = '__VITEVAL_DATASET_PROVIDER_REGISTRY__' as const;

  if (!globalThis[globalKey]) {
    globalThis[globalKey] = new DatasetProviderRegistry();
  }

  return globalThis[globalKey];
}

export const providerRegistry = getGlobalDatasetProviderRegistry();

export function registerProvider(
  metadata: DatasetProviderMetadata
): void {
  providerRegistry.register(metadata);
}

export function createProvider(
  type: string,
  config: Record<string, unknown>
): DatasetProvider {
  return providerRegistry.create(type, config);
}
