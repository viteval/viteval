import type { Scorer } from '#/types';
import { createScorer } from '#/scorer/custom';
import { computeEmbeddingSimilarity } from './embed';

/**
 * Create an answer similarity scorer using embedding cosine similarity.
 *
 * @returns A scorer that embeds both strings via the configured embedding model and computes cosine similarity.
 *
 * @example
 * ```ts
 * import { scorers } from 'viteval';
 *
 * scorers: [scorers.answerSimilarity()]
 * ```
 */
export function answerSimilarity(): Scorer {
  return createScorer({
    name: 'AnswerSimilarity',
    score: ({ output, expected }) =>
      computeEmbeddingSimilarity(output, expected),
  });
}
