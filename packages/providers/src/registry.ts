import type { Provider, ProviderMetadata } from './types';
import {
  ProviderAlreadyRegisteredError,
  ProviderNotFoundError,
} from './errors';

/**
 * Global provider registry that manages dataset provider registration and creation.
 */
class ProviderRegistry {
  private providers = new Map<string, ProviderMetadata>();

  /**
   * Register a provider in the global registry.
   *
   * @param metadata - Provider metadata including type, package name, and factory
   * @throws {ProviderAlreadyRegisteredError} If a provider with the same type is already registered
   *
   * @example
   * ```ts
   * providerRegistry.register({
   *   type: 'voltagent',
   *   packageName: '@viteval/voltagent',
   *   factory: createVoltagentProvider,
   * });
   * ```
   */
  register(metadata: ProviderMetadata): void {
    if (this.providers.has(metadata.type)) {
      throw new ProviderAlreadyRegisteredError(metadata.type);
    }
    this.providers.set(metadata.type, metadata);
  }

  /**
   * Check if a provider is registered.
   *
   * @param type - Provider type identifier
   * @returns True if the provider is registered
   */
  has(type: string): boolean {
    return this.providers.has(type);
  }

  /**
   * Get provider metadata.
   *
   * @param type - Provider type identifier
   * @returns Provider metadata if found, undefined otherwise
   */
  get(type: string): ProviderMetadata | undefined {
    return this.providers.get(type);
  }

  /**
   * Get all registered providers.
   *
   * @returns Array of all registered provider metadata
   */
  list(): ProviderMetadata[] {
    return Array.from(this.providers.values());
  }

  /**
   * Attempt to auto-load a provider package by dynamically importing it.
   * If the provider package exists and registers itself on import, this will succeed.
   *
   * @param type - Provider type identifier
   * @returns True if the provider was successfully loaded and registered
   *
   * @example
   * ```ts
   * const loaded = await providerRegistry.autoLoad('voltagent');
   * if (loaded) {
   *   // Provider is now registered
   * }
   * ```
   */
  async autoLoad(type: string): Promise<boolean> {
    if (this.has(type)) {
      return true;
    }

    // Try to dynamically import the provider package
    const packageName = `@viteval/${type}`;
    try {
      await import(packageName);
      // Provider should self-register during import
      return this.has(type);
    } catch {
      return false;
    }
  }

  /**
   * Create a provider instance with auto-loading support.
   * If the provider is not registered, attempts to auto-load it.
   *
   * @param providerType - Provider type identifier
   * @param datasetConfig - Full dataset configuration object
   * @returns Provider instance
   * @throws {ProviderNotFoundError} If the provider cannot be found or loaded
   *
   * @example
   * ```ts
   * const provider = await providerRegistry.create('voltagent', {
   *   name: 'my-dataset',
   *   provider: 'voltagent',
   *   datasetId: 'abc123',
   * });
   * ```
   */
  async create(
    providerType: string,
    datasetConfig: Record<string, unknown>
  ): Promise<Provider> {
    // Try auto-loading first
    const loaded = await this.autoLoad(providerType);

    if (!loaded) {
      const metadata = this.get(providerType);
      const packageName = metadata?.packageName ?? `@viteval/${providerType}`;
      throw new ProviderNotFoundError(providerType, packageName);
    }

    const metadata = this.get(providerType)!;
    return metadata.factory(datasetConfig);
  }
}

/**
 * Global provider registry singleton.
 */
export const providerRegistry = new ProviderRegistry();

/**
 * Register a provider in the global registry.
 * This is typically called by provider packages when they are imported.
 *
 * @param metadata - Provider metadata including type, package name, and factory
 *
 * @example
 * ```ts
 * import { registerProvider } from '@viteval/providers';
 *
 * registerProvider({
 *   type: 'voltagent',
 *   packageName: '@viteval/voltagent',
 *   factory: async (config) => createVoltagentProvider(config),
 * });
 * ```
 */
export function registerProvider(metadata: ProviderMetadata): void {
  providerRegistry.register(metadata);
}

/**
 * Create a provider instance from a provider type and dataset configuration.
 * Attempts to auto-load the provider if not already registered.
 *
 * @param type - Provider type identifier (e.g., 'voltagent')
 * @param config - Full dataset configuration object
 * @returns Provider instance
 * @throws {ProviderNotFoundError} If the provider cannot be found or loaded
 *
 * @example
 * ```ts
 * const provider = await createProvider('voltagent', {
 *   name: 'my-dataset',
 *   provider: 'voltagent',
 *   datasetId: 'abc123',
 * });
 * ```
 */
export async function createProvider(
  type: string,
  config: Record<string, unknown>
): Promise<Provider> {
  return providerRegistry.create(type, config);
}
