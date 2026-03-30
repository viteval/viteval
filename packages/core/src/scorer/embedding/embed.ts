import { clamp } from '@viteval/internal';
import cosineSimilarity from 'compute-cosine-similarity';
import { requireClient } from '#/provider/client';

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Get an embedding vector for the given text using OpenAI's embeddings API.
 *
 * @param text - The text to embed.
 * @param model - The embedding model to use.
 * @returns The embedding vector as a number array.
 *
 * @example
 * ```ts
 * const vector = await getEmbedding('Hello world');
 * ```
 */
export async function getEmbedding(
  text: string,
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<number[]> {
  const client = requireClient();

  const response = await client.embeddings.create({
    input: text,
    model,
  });

  return response.data[0].embedding;
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
