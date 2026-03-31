import type { DatasetProvider, EvalProvider, Provider } from './types';

/**
 * Ensure provider initialization has completed.
 *
 * `defineConfig` fires off `initializeProvider()` without awaiting it
 * (Vitest requires synchronous config). This helper awaits the stored
 * promise so callers that need the provider can safely wait for it.
 *
 * @returns A promise that resolves once provider initialization has finished.
 */
export async function ensureProviderReady(): Promise<void> {
  if (globalThis.__viteval_providerInitialized) return;
  if (globalThis.__viteval_providerInitPromise) {
    await globalThis.__viteval_providerInitPromise;
  }
}

/**
 * Get the full provider, if one was configured.
 *
 * @returns The provider, or null if not configured.
 */
export function getProvider(): Provider | null {
  return globalThis.__viteval_provider ?? null;
}

/**
 * Get the dataset provider.
 *
 * @returns The dataset provider, or null if not configured.
 */
export function getDatasetProvider(): DatasetProvider | null {
  return globalThis.__viteval_datasetProvider ?? null;
}

/**
 * Get the dataset provider, throwing if not configured.
 *
 * Awaits provider initialization before returning.
 *
 * @returns The dataset provider.
 * @throws If no provider with dataset support is configured.
 */
export async function requireDatasetProvider(): Promise<DatasetProvider> {
  await ensureProviderReady();
  const provider = getDatasetProvider();
  if (!provider) {
    throw new Error(
      'No dataset provider configured. Add a provider with dataset support to your viteval config.'
    );
  }
  return provider;
}

/**
 * Get the eval provider.
 *
 * @returns The eval provider, or null if not configured.
 */
export function getEvalProvider(): EvalProvider | null {
  return globalThis.__viteval_evalProvider ?? null;
}

/**
 * Get the eval provider, throwing if not configured.
 *
 * Awaits provider initialization before returning.
 *
 * @returns The eval provider.
 * @throws If no provider with eval support is configured.
 */
export async function requireEvalProvider(): Promise<EvalProvider> {
  await ensureProviderReady();
  const provider = getEvalProvider();
  if (!provider) {
    throw new Error(
      'No eval provider configured. Add a provider with eval support to your viteval config.'
    );
  }
  return provider;
}
