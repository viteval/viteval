import type {
  DatasetProvider,
  EvalProvider,
  Provider,
  TagProvider,
} from './types';

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
 * Get the eval provider.
 *
 * @returns The eval provider, or null if not configured.
 */
export function getEvalProvider(): EvalProvider | null {
  return globalThis.__viteval_evalProvider ?? null;
}

/**
 * Get the tag provider.
 *
 * @returns The tag provider, or null if not configured.
 */
export function getTagProvider(): TagProvider | null {
  return globalThis.__viteval_tagProvider ?? null;
}
