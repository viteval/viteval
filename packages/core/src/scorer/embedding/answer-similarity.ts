import { createScorer } from '#/scorer/custom';
import { computeEmbeddingSimilarity } from './embed';

/**
 * Scores answer similarity between output and expected using embedding cosine similarity.
 *
 * Embeds both strings via the configured embedding model and computes cosine similarity,
 * clamped to [0, 1].
 *
 * @example
 * ```ts
 * import { answerSimilarity } from '@viteval/core';
 *
 * const result = await answerSimilarity({
 *   input: 'What is the capital of France?',
 *   output: 'Paris',
 *   expected: 'The capital of France is Paris.',
 * });
 * ```
 */
export const answerSimilarity = createScorer({
  name: 'AnswerSimilarity',
  score: ({ output, expected }) => computeEmbeddingSimilarity(output, expected),
});
