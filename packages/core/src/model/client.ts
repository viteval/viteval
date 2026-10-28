import type { EmbeddingModel, LanguageModel } from 'ai';
import { type Result, attempt, err, ok } from 'massaman/control';
import { getProjectRuntime } from '#/config/runtime';
import type { ModelId } from '#/config/types';

export type LanguageModelSelection = Exclude<LanguageModel, string> | ModelId;
export type EmbeddingModelSelection = Exclude<EmbeddingModel, string> | ModelId;

/**
 * Get the language model.
 *
 * @returns The language model, or null if not initialized.
 */
export function getModel(): LanguageModel | null {
  const runtime = getProjectRuntime(),
    id = runtime?.config.models?.defaults?.language;
  return runtime && id ? runtime.context.models.languageModel(id) : null;
}

/**
 * Get the initialized language model.
 *
 * @returns The initialized language model or an initialization error.
 */
export function requireModel(): Result<LanguageModel> {
  const resolved = attempt(getModel);
  if (!resolved.ok) {
    return resolved;
  }
  const model = resolved.value;
  if (!model) {
    return err(
      'Language model not configured. Set models.defaults.language in viteval.config.ts or pass a model to the scorer.'
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
  const runtime = getProjectRuntime(),
    id = runtime?.config.models?.defaults?.embedding;
  return runtime && id ? runtime.context.models.embeddingModel(id) : null;
}

/**
 * Get the configured embedding model.
 *
 * @returns The initialized embedding model or a configuration error.
 */
export function requireEmbeddingModel(): Result<EmbeddingModel> {
  const resolved = attempt(getEmbeddingModel);
  if (!resolved.ok) {
    return resolved;
  }
  const model = resolved.value;
  if (!model) {
    return err(
      'Embedding model not configured. Set models.defaults.embedding in viteval.config.ts or pass a model to the scorer.'
    );
  }
  return ok(model);
}

/**
 * Resolve a scorer override through the active AI SDK registry.
 * @param selection - A namespaced model ID or direct SDK model instance.
 * @returns A resolved language model or configuration error.
 * @example resolveLanguageModel('openai:gpt-4.1-mini');
 */
export function resolveLanguageModel(
  selection?: LanguageModelSelection
): Result<LanguageModel> {
  if (selection === undefined) {
    return requireModel();
  }
  if (typeof selection !== 'string') {
    return ok(selection);
  }
  return attempt(() => {
    const runtime = getProjectRuntime();
    if (!runtime) {
      throw new Error(
        'Model IDs require models.providers in viteval.config.ts'
      );
    }
    return runtime.context.models.languageModel(selection);
  });
}

/**
 * Resolve an embedding scorer override through the active AI SDK registry.
 * @param selection - A namespaced model ID or direct SDK model instance.
 * @returns A resolved embedding model or configuration error.
 * @example resolveEmbeddingModel('openai:text-embedding-3-small');
 */
export function resolveEmbeddingModel(
  selection?: EmbeddingModelSelection
): Result<EmbeddingModel> {
  if (selection === undefined) {
    return requireEmbeddingModel();
  }
  if (typeof selection !== 'string') {
    return ok(selection);
  }
  return attempt(() => {
    const runtime = getProjectRuntime();
    if (!runtime) {
      throw new Error(
        'Model IDs require models.providers in viteval.config.ts'
      );
    }
    return runtime.context.models.embeddingModel(selection);
  });
}
