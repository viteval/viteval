import { ok } from 'massaman/control';
import type { CreateProviderParams, Provider } from './types';

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
  const { name, datasets, evals, tags, initialize, close } = params;

  return {
    close: close ?? (() => Promise.resolve(ok(undefined))),
    datasets,
    evals,
    initialize: initialize ?? (() => Promise.resolve(ok(undefined))),
    name,
    tags,
  };
}
