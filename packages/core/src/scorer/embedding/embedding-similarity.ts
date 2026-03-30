import type { Extra, Scorer } from '#/types';
import { createScorer } from '#/scorer/custom';
import { computeEmbeddingSimilarity } from './embed';

/**
 * Create a semantic similarity scorer using embedding cosine similarity.
 *
 * @returns A scorer that embeds both strings via the configured embedding model and computes cosine similarity.
 *
 * @example
 * ```ts
 * import { scorers } from 'viteval';
 *
 * scorers: [scorers.embeddingSimilarity()]
 * ```
 */
export function embeddingSimilarity(): Scorer<unknown, Extra> {
  return createScorer({
    name: 'EmbeddingSimilarity',
    score: ({ output, expected }) =>
      computeEmbeddingSimilarity(output, expected),
  });
}
