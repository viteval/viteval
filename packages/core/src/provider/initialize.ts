import type {
  DatasetProvider,
  EvalProvider,
  Provider,
  ProviderConfig,
} from './types';

/**
 * Initialize the provider configuration.
 *
 * Resolves composite configs into individual domain providers
 * and stores them on globalThis for access during eval runs.
 *
 * @param config - The provider config (single provider or per-domain).
 */
export async function initializeProvider(
  config: ProviderConfig
): Promise<void> {
  if (globalThis.__viteval_providerInitialized) {
    return;
  }

  if (isProvider(config)) {
    globalThis.__viteval_provider = config;

    const result = await config.initialize();
    if (!result.ok) {
      throw result.result;
    }

    globalThis.__viteval_datasetProvider = config.datasets;
    globalThis.__viteval_evalProvider = config.evals;
  } else {
    // Initialize any full providers passed to domain slots
    if (config.datasets && isProvider(config.datasets)) {
      const result = await config.datasets.initialize();
      if (!result.ok) {
        throw result.result;
      }
    }
    if (
      config.evals &&
      isProvider(config.evals) &&
      config.evals !== config.datasets
    ) {
      const result = await config.evals.initialize();
      if (!result.ok) {
        throw result.result;
      }
    }

    globalThis.__viteval_datasetProvider = resolveSubProvider(
      config.datasets,
      'datasets'
    );
    globalThis.__viteval_evalProvider = resolveSubProvider(
      config.evals,
      'evals'
    );
  }

  globalThis.__viteval_providerInitialized = true;
}

/*
|------------------
| Internals
|------------------
*/

function isProvider(value: unknown): value is Provider {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'initialize' in value &&
    'close' in value
  );
}

function resolveSubProvider<K extends 'datasets' | 'evals'>(
  value: DatasetProvider | EvalProvider | Provider | undefined,
  key: K
): (K extends 'datasets' ? DatasetProvider : EvalProvider) | undefined {
  if (!value) {
    return undefined;
  }
  if (isProvider(value)) {
    // eslint-disable-next-line no-explicit-any -- narrowing from union
    return value[key] as any;
  }
  // eslint-disable-next-line no-explicit-any -- narrowing from union
  return value as any;
}
