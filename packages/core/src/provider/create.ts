import type { Result } from '@viteval/internal';
import type { CreateProviderParams, Provider } from './types';

const ok: Result<void> = { ok: true, result: undefined, status: 'ok' };

/**
 * Create a custom provider from individual domain implementations.
 *
 * @param params - The provider configuration.
 * @returns A Provider instance.
 *
 * @example
 * ```ts
 * import { createProvider } from '@viteval/core';
 *
 * const myProvider = createProvider({
 *   name: 'langfuse',
 *   datasets: myDatasetOps,
 *   evals: myEvalOps,
 * });
 * ```
 */
export function createProvider(params: CreateProviderParams): Provider {
  const { name, datasets, evals, initialize, close } = params;

  return {
    close: close ?? (() => Promise.resolve(ok)),
    datasets,
    evals,
    initialize: initialize ?? (() => Promise.resolve(ok)),
    name,
  };
}
