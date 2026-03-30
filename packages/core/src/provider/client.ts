import type { DatasetProvider, EvalProvider, Provider } from './types';

/**
 * Get the full provider, if one was configured.
 *
 * @returns The provider, or null if not configured.
 */
export function getProvider(): Provider | null {
  return globalThis.__provider ?? null;
}

/**
 * Get the dataset provider.
 *
 * @returns The dataset provider, or null if not configured.
 */
export function getDatasetProvider(): DatasetProvider | null {
  return globalThis.__datasetProvider ?? null;
}

/**
 * Get the dataset provider, throwing if not configured.
 *
 * @returns The dataset provider.
 * @throws If no provider with dataset support is configured.
 */
export function requireDatasetProvider(): DatasetProvider {
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
  return globalThis.__evalProvider ?? null;
}

/**
 * Get the eval provider, throwing if not configured.
 *
 * @returns The eval provider.
 * @throws If no provider with eval support is configured.
 */
export function requireEvalProvider(): EvalProvider {
  const provider = getEvalProvider();
  if (!provider) {
    throw new Error(
      'No eval provider configured. Add a provider with eval support to your viteval config.'
    );
  }
  return provider;
}
