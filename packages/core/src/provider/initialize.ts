import type { VitevalProviderConfig } from '#/config/types';

/**
 * Initialize the provider with AI SDK models.
 *
 * @param config - The provider config containing AI SDK model instances.
 */
export function initializeProvider(config: VitevalProviderConfig) {
  if (globalThis.__model) {
    return;
  }

  globalThis.__model = config.model;
  globalThis.__embeddingModel = config.embeddingModel;
}
