import { embed } from 'ai';
import { type Result, attemptAsync, isErr } from 'massaman/control';
import { clamp } from '@viteval/internal';
import cosineSimilarity from 'compute-cosine-similarity';
import {
  type EmbeddingModelSelection,
  resolveEmbeddingModel,
} from '#/model/client';

export interface EmbeddingScorerOptions {
  model?: EmbeddingModelSelection;
}

/**
 * Get an embedding vector for the given text using the configured embedding model.
 *
 * @param text - The text to embed.
 * @returns The embedding vector or the error that prevented generation.
 *
 * @example
 * ```ts
 * const result = await getEmbedding('Hello world');
 * if (result.ok) {
 *   const vector = result.value;
 * }
 * ```
 */
export async function getEmbedding(
  text: string,
  options?: EmbeddingScorerOptions
): Promise<Result<number[]>> {
  const modelResult = resolveEmbeddingModel(options?.model);
  if (isErr(modelResult)) {
    return modelResult;
  }
  const model = modelResult.value;

  return attemptAsync(async () => {
    const { embedding } = await embed({
      model,
      value: text,
    });
    return embedding;
  });
}

/**
 * Compute embedding cosine similarity between two strings.
 *
 * @param output - The output string to embed.
 * @param expected - The expected string to embed.
 * @returns Score and similarity metadata.
 */
export async function computeEmbeddingSimilarity(
  output: unknown,
  expected: unknown,
  options?: EmbeddingScorerOptions
): Promise<{
  score: number | null;
  metadata: { similarity: number; error?: string };
}> {
  const outputStr = String(output),
    expectedStr = String(expected);

  if (outputStr === expectedStr) {
    return { metadata: { similarity: 1 }, score: 1 };
  }

  const [outputResult, expectedResult] = await Promise.all([
    getEmbedding(outputStr, options),
    getEmbedding(expectedStr, options),
  ]);
  if (isErr(outputResult) || isErr(expectedResult)) {
    const error = isErr(outputResult)
      ? outputResult.error
      : expectedResult.error;
    return {
      metadata: { error: error?.message ?? 'Embedding failed', similarity: 0 },
      score: null,
    };
  }

  const similarity =
      cosineSimilarity(outputResult.value, expectedResult.value) ?? 0,
    score = clamp(similarity, 0, 1);

  return { metadata: { similarity }, score };
}
