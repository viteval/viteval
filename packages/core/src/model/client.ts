import type { EmbeddingModel, LanguageModel } from 'ai';
import { err, ok, type Result } from 'massaman/control';

/**
 * Get the language model.
 *
 * @returns The language model, or null if not initialized.
 */
export function getModel(): LanguageModel | null {
  return globalThis.__viteval_model ?? null;
}

/**
 * Get the initialized language model.
 *
 * @returns The initialized language model or an initialization error.
 */
export function requireModel(): Result<LanguageModel> {
  const model = getModel();
  if (!model) {
    return err(
      'Model not initialized. Call initializeModel() from a Vitest setup file.'
    );
  }
  return ok(model);
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
 * Get the configured embedding model.
 *
 * @returns The initialized embedding model or a configuration error.
 */
export function requireEmbeddingModel(): Result<EmbeddingModel> {
  const model = getEmbeddingModel();
  if (!model) {
    return err(
      'Embedding model not configured. Add an embedding model to your model config to use embedding-based scorers.'
    );
  }
  return ok(model);
}
