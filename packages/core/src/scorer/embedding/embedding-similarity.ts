import { createScorer } from '#/scorer/custom';
import { computeEmbeddingSimilarity } from './embed';

/**
 * Scores semantic similarity between output and expected using embedding cosine similarity.
 *
 * Embeds both strings via the configured embedding model and computes cosine similarity,
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
  score: ({ output, expected }) => computeEmbeddingSimilarity(output, expected),
});
