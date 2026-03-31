import { embed } from 'ai';
import { clamp } from '@viteval/internal';
import cosineSimilarity from 'compute-cosine-similarity';
import { requireEmbeddingModel } from '#/model/client';

/**
 * Get an embedding vector for the given text using the configured embedding model.
 *
 * @param text - The text to embed.
 * @returns The embedding vector as a number array.
 *
 * @example
 * ```ts
 * const vector = await getEmbedding('Hello world');
 * ```
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const model = requireEmbeddingModel();

  const { embedding } = await embed({
    model,
    value: text,
  });

  return embedding;
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
  expected: unknown
): Promise<{ score: number; metadata: { similarity: number } }> {
  const outputStr = String(output);
  const expectedStr = String(expected);

  if (outputStr === expectedStr) {
    return { metadata: { similarity: 1 }, score: 1 };
  }

  const [outputEmb, expectedEmb] = await Promise.all([
    getEmbedding(outputStr),
    getEmbedding(expectedStr),
  ]);

  const similarity = cosineSimilarity(outputEmb, expectedEmb) ?? 0;
  const score = clamp(similarity, 0, 1);

  return { metadata: { similarity }, score };
}
