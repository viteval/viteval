import type {
  DatasetProvider,
  EvalProvider,
  Provider,
  ProviderConfig,
  TagProvider,
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
    globalThis.__viteval_tagProvider = config.tags;
  } else {
    const initialized = new Set<Provider>();
    for (const slot of [config.datasets, config.evals, config.tags]) {
      if (slot && isProvider(slot) && !initialized.has(slot)) {
        const result = await slot.initialize();
        if (!result.ok) {
          throw result.result;
        }
        initialized.add(slot);
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
    globalThis.__viteval_tagProvider = resolveSubProvider(config.tags, 'tags');
  }

  globalThis.__viteval_providerInitialized = true;
  globalThis.__viteval_providerInitPromise = undefined;
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

type SubProviderForKey<K extends 'datasets' | 'evals' | 'tags'> =
  K extends 'datasets'
    ? DatasetProvider
    : K extends 'evals'
      ? EvalProvider
      : TagProvider;

function resolveSubProvider<K extends 'datasets' | 'evals' | 'tags'>(
  value: DatasetProvider | EvalProvider | TagProvider | Provider | undefined,
  key: K
): SubProviderForKey<K> | undefined {
  if (!value) {
    return undefined;
  }
  if (isProvider(value)) {
    return value[key] as SubProviderForKey<K> | undefined;
  }
  return value as SubProviderForKey<K>;
}
