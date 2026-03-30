import type { EmbeddingModel, LanguageModel } from 'ai';

/**
 * Get the language model.
 *
 * @returns The language model, or null if not initialized.
 */
export function getModel(): LanguageModel | null {
  return globalThis.__viteval_model ?? null;
}

/**
 * Get the language model, throwing if not initialized.
 *
 * @returns The initialized language model.
 * @throws If the model has not been initialized via `defineConfig()`.
 */
export function requireModel(): LanguageModel {
  const model = getModel();
  if (!model) {
    throw new Error(
      'Model not initialized. Configure a model in your viteval config.'
    );
  }
  return model;
}

/**
 * Get the embedding model.
 *
 * @returns The embedding model, or null if not configured.
 */
export function getEmbeddingModel(): EmbeddingModel | null {
  return globalThis.__viteval_embeddingModel ?? null;
}

/**
 * Get the embedding model, throwing if not configured.
 *
 * @returns The initialized embedding model.
 * @throws If no embedding model was provided in the model config.
 */
export function requireEmbeddingModel(): EmbeddingModel {
  const model = getEmbeddingModel();
  if (!model) {
    throw new Error(
      'Embedding model not configured. Add an embedding model to your model config to use embedding-based scorers.'
    );
  }
  return model;
}
