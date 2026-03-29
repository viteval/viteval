import { getClient } from '#/provider/client';

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
  const client = getClient();
  if (!client) {
    throw new Error('OpenAI client not initialized. Call initializeProvider() first.');
  }

  const response = await client.embeddings.create({
    model,
    input: text,
  });

  return response.data[0].embedding;
}
