import type { EmbeddingModel, LanguageModel } from 'ai';

/**
 * Get the language model for the provider.
 *
 * @returns The language model, or null if not initialized.
 */
export function getModel(): LanguageModel | null {
  return globalThis.__model ?? null;
}

/**
 * Get the language model, throwing if not initialized.
 *
 * @returns The initialized language model.
 * @throws If the provider has not been initialized via `initializeProvider()`.
 */
export function requireModel(): LanguageModel {
  const model = getModel();
  if (!model) {
    throw new Error(
      'Provider not initialized. Configure a provider in your viteval config or call initializeProvider() first.'
    );
  }
  return model;
}

/**
 * Get the embedding model for the provider.
 *
 * @returns The embedding model, or null if not configured.
 */
export function getEmbeddingModel(): EmbeddingModel | null {
  return globalThis.__embeddingModel ?? null;
}

/**
 * Get the embedding model, throwing if not configured.
 *
 * @returns The initialized embedding model.
 * @throws If no embedding model was provided in the provider config.
 */
export function requireEmbeddingModel(): EmbeddingModel {
  const model = getEmbeddingModel();
  if (!model) {
    throw new Error(
      'Embedding model not configured. Add an embeddingModel to your provider config to use embedding-based scorers.'
    );
  }
  return model;
}
