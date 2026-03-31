import type { EmbeddingModel, LanguageModel } from 'ai';

/**
 * Full model configuration with both language and embedding models.
 */
export interface ModelConfigFull {
  /**
   * Language model used for LLM-as-judge scorers.
   */
  language: LanguageModel;
  /**
   * Embedding model used for embedding-based scorers (e.g. `embeddingSimilarity`, `answerSimilarity`).
   *
   * Only required if you use embedding scorers.
   */
  embedding?: EmbeddingModel;
}

/**
 * Model configuration for LLM-based and embedding-based scorers.
 *
 * Accepts a `LanguageModel` directly (shorthand), or a full config object
 * with both `language` and `embedding` models.
 *
 * Uses Vercel AI SDK models — bring your own provider package
 * (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, etc.).
 *
 * @example Shorthand
 * ```ts
 * import { openai } from '@ai-sdk/openai';
 *
 * defineConfig({
 *   model: openai('gpt-4o'),
 * });
 * ```
 *
 * @example Full config
 * ```ts
 * import { openai } from '@ai-sdk/openai';
 *
 * defineConfig({
 *   model: {
 *     language: openai('gpt-4o'),
 *     embedding: openai.embedding('text-embedding-3-small'),
 *   },
 * });
 * ```
 */
export type ModelConfig = LanguageModel | ModelConfigFull;
