import { clamp } from '@viteval/internal';
import cosineSimilarity from 'compute-cosine-similarity';
import { createScorer } from '#/scorer/custom';
import { getEmbedding } from './embed';

/**
 * Scores semantic similarity between output and expected using embedding cosine similarity.
 *
 * Embeds both strings via OpenAI's embeddings API and computes cosine similarity,
 * clamped to [0, 1].
 *
 * @example
 * ```ts
 * import { embeddingSimilarity } from '@viteval/core';
 *
 * const result = await embeddingSimilarity({
 *   input: 'q',
 *   output: 'The cat sat on the mat.',
 *   expected: 'A cat was sitting on a mat.',
 * });
 * ```
 */
export const embeddingSimilarity = createScorer({
  name: 'EmbeddingSimilarity',
  score: async ({ output, expected }) => {
    const outputStr = String(output);
    const expectedStr = String(expected);

    const [outputEmb, expectedEmb] = await Promise.all([
      getEmbedding(outputStr),
      getEmbedding(expectedStr),
    ]);

    const similarity = cosineSimilarity(outputEmb, expectedEmb) ?? 0;
    const score = clamp(similarity, 0, 1);

    return {
      score,
      metadata: { similarity },
    };
  },
});
