import { createProviderRegistry } from 'ai';
import type { EmbeddingModel, LanguageModel } from 'ai';
import { isErr } from 'massaman/control';
import { createJsonProvider } from '#/provider/json';
import type { Provider } from '#/provider/types';
import type {
  DatasetHandle,
  DatasetProviderName,
  DatasetReference,
  ResultProviderName,
} from '#/provider/registry';
import type { DataItem } from '#/types';
import type { ModelId, ModelProvider, VitevalConfig } from './types';

export type RuntimeContext = Record<DatasetProviderName, DatasetHandle> & {
  models: {
    languageModel(id: ModelId): LanguageModel;
    embeddingModel(id: ModelId): EmbeddingModel;
  };
};

export type ProjectRuntime = ReturnType<typeof createProjectRuntime>;

/**
 * Create isolated, lazy clients for a single project worker.
 * @param config - The worker-local configuration.
 * @returns Context resolution, destination selection, and resource cleanup.
 * @example const runtime = createProjectRuntime({ eval: { results: [] } });
 */
export function createProjectRuntime(config: VitevalConfig) {
  validateOptions(config);
  const providers = config.providers ?? [
      createJsonProvider({ root: config.root }),
    ],
    byName = new Map<string, Provider>();
  for (const provider of providers) {
    if (byName.has(provider.name)) {
      throw new Error(
        `Duplicate storage provider: ${provider.name}. Use separate configs for separate projects.`
      );
    }
    if (provider.name === 'models') {
      throw new Error('Storage provider name "models" is reserved');
    }
    byName.set(provider.name, provider);
  }
  const initialized = new Map<string, Promise<Provider>>();
  let closed = false,
    registry: ReturnType<typeof createProviderRegistry> | undefined;
  function models() {
    if (registry) {
      return registry;
    }
    const entries = new Map<string, ModelProvider>();
    for (const provider of config.models?.providers ?? []) {
      const name = modelProviderName(provider);
      if (entries.has(name)) {
        throw new Error(`Duplicate model provider: ${name}`);
      }
      entries.set(name, provider);
    }
    registry = createProviderRegistry(Object.fromEntries(entries));
    return registry;
  }
  async function provider(name: string): Promise<Provider> {
    if (closed) {
      throw new Error('Viteval project runtime is closed');
    }
    const instance = byName.get(name);
    if (!instance) {
      throw new Error(
        `Storage provider "${name}" is not registered in viteval.config.ts`
      );
    }
    let pending = initialized.get(name);
    if (!pending) {
      pending = (async () => {
        const result = await instance.initialize();
        if (isErr(result)) {
          throw new Error(
            `Failed to initialize provider "${name}": ${result.error.message}`,
            { cause: result.error }
          );
        }
        return instance;
      })();
      initialized.set(name, pending);
    }
    return pending;
  }
  const modelContext = {
    embeddingModel(id: ModelId) {
      validateModelId(id);
      return models().embeddingModel(id);
    },
    languageModel(id: ModelId) {
      validateModelId(id);
      return models().languageModel(id);
    },
  };
  if (config.models) {
    models();
    if (config.models.defaults?.language) {
      modelContext.languageModel(config.models.defaults.language);
    }
    if (config.models.defaults?.embedding) {
      modelContext.embeddingModel(config.models.defaults.embedding);
    }
  }
  const handles = Object.fromEntries(
      providers.map((instance) => [
        instance.name,
        {
          dataset<ITEM extends DataItem = DataItem>(
            name: string
          ): DatasetReference<ITEM> {
            return {
              async load() {
                const resolved = await provider(instance.name);
                if (!resolved.datasets)
                  throw new Error(
                    `Provider "${instance.name}" does not support datasets`
                  );
                const dataset = await resolved.datasets.get({ name });
                if (isErr(dataset)) throw dataset.error;
                if (!dataset.value)
                  throw new Error(
                    `Dataset "${name}" not found in provider "${instance.name}"`
                  );
                const items = await resolved.datasets.getItems({
                  datasetId: dataset.value.id,
                });
                if (isErr(items)) throw items.error;
                // Remote records are type-erased; the caller owns the declared case shape.
                return items.value.map(({ input, expected, extra }) => ({
                  ...extra,
                  input,
                  expected,
                })) as ITEM[];
              },
              name,
            };
          },
        },
      ])
    ),
    context = new Proxy(
      { ...handles, models: modelContext },
      {
        get(target, name, receiver) {
          if (typeof name === 'string' && !(name in target)) {
            throw new Error(
              `Storage provider "${name}" is not registered in viteval.config.ts`
            );
          }
          return Reflect.get(target, name, receiver);
        },
      }
    ) as RuntimeContext;
  return {
    async close() {
      if (closed) return;
      closed = true;
      const results = await Promise.allSettled(
        [...initialized.entries()].map(async ([name, pending]) => {
          // Initialization can allocate resources before returning an error.
          await Promise.allSettled([pending]);
          const instance = byName.get(name)!;
          const result = await instance.close();
          if (isErr(result))
            throw new Error(
              `Failed to close provider "${instance.name}": ${result.error.message}`,
              { cause: result.error }
            );
        })
      );
      const failures = results
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason);
      if (failures.length)
        throw new AggregateError(failures, 'Failed to close Viteval providers');
    },
    config,
    context,
    datasetNames(names?: readonly DatasetProviderName[]) {
      return selectNames(
        names ??
          config.dataset?.providers ??
          (byName.has('json') ? ['json'] : [])
      );
    },
    provider,
    resultNames(names?: readonly ResultProviderName[]) {
      return selectNames(
        names ?? config.eval?.results ?? (byName.has('json') ? ['json'] : [])
      );
    },
  };

  function selectNames(names: readonly string[]): readonly string[] {
    if (!Array.isArray(names)) {
      throw new Error('Provider destinations must be an array');
    }
    for (const name of names) {
      if (!byName.has(name)) {
        throw new Error(
          `Storage provider "${name}" is not registered in viteval.config.ts`
        );
      }
    }
    return [...new Set(names)];
  }
}

/**
 * Read the runtime shared by module copies in the current isolated worker.
 * @returns The active project runtime, if a Viteval config was loaded.
 * @example const context = getProjectRuntime()?.context;
 */
export function getProjectRuntime(): ProjectRuntime | undefined {
  return globalThis.__viteval_runtime;
}

/**
 * Close the active worker runtime even when collection or suite hooks fail.
 * @returns A promise that settles after all attempted providers are closed.
 * @example await closeProjectRuntime();
 * @internal
 */
export async function closeProjectRuntime(): Promise<void> {
  const runtime = getProjectRuntime();
  try {
    await runtime?.close();
  } finally {
    globalThis.__viteval_runtime = undefined;
  }
}

/**
 * Install a runtime for a worker; replacing a live runtime is not allowed.
 * @param runtime - A newly created, worker-local runtime.
 * @returns Nothing.
 * @example setProjectRuntime(createProjectRuntime(config));
 */
export function setProjectRuntime(runtime: ProjectRuntime): void {
  if (globalThis.__viteval_runtime) {
    throw new Error('Viteval project runtime is already active');
  }
  globalThis.__viteval_runtime = runtime;
}

/**
 * Resolve a dependency callback without requiring project initialization ceremonies.
 * @returns Configured dependencies, or local JSON defaults outside the CLI.
 * @example const cases = await getRuntimeContext().json.dataset('support').load();
 */
export function getRuntimeContext(): RuntimeContext {
  return (getProjectRuntime() ?? createProjectRuntime({})).context;
}

function modelProviderName(provider: ModelProvider): string {
  // AI SDK model construction is local: no credentials or API call is needed.
  // The model's provider identifier is the SDK's public identity, not a JS function name.
  // SDK API variants append one segment (for example, ".responses") to that identity.
  const errors: unknown[] = [];
  for (const create of [
    () => provider.languageModel('__viteval_identity__'),
    () => provider.embeddingModel?.('__viteval_identity__'),
  ]) {
    try {
      const model = create(),
        name = model?.provider.replace(/\.[^.]+$/, '');
      if (name) {
        return name;
      }
    } catch (error) {
      errors.push(error);
    }
  }
  throw new AggregateError(
    errors,
    'Cannot determine AI SDK provider identity from its language or embedding model API. Use a raw SDK provider that accepts arbitrary model IDs; finite customProvider catalogs cannot be identified automatically.'
  );
}

function validateModelId(id: string): void {
  const separator = id.indexOf(':');
  if (separator <= 0 || separator === id.length - 1) {
    throw new Error(`Invalid model ID "${id}". Expected provider:model-id`);
  }
}

function validateOptions(config: VitevalConfig): void {
  for (const [name, value] of Object.entries({
    concurrency: config.eval?.concurrency,
    retries: config.eval?.retries,
    timeout: config.eval?.timeout,
  })) {
    if (value === undefined) {
      continue;
    }
    if (!Number.isSafeInteger(value) || value < (name === 'retries' ? 0 : 1)) {
      throw new Error(
        `eval.${name} must be ${name === 'retries' ? 'a non-negative' : 'a positive'} integer`
      );
    }
  }
  if (
    config.eval?.threshold !== undefined &&
    !Number.isFinite(config.eval.threshold)
  ) {
    throw new Error('eval.threshold must be finite');
  }
}
