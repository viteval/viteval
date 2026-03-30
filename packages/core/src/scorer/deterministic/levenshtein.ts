import levenshtein from 'js-levenshtein';
import type { Scorer } from '#/types';
import { createScorer } from '#/scorer/custom';
import { levenshteinSimilarity } from './similarity';

/**
 * Options for the Levenshtein scorer.
 */
export interface LevenshteinOptions {
  /**
   * Minimum similarity threshold. Scores below this value are returned as 0.
   *
   * @default 0
   */
  threshold?: number;
}

/**
 * Create a Levenshtein similarity scorer.
 *
 * @param options - Optional configuration.
 * @returns A scorer that computes Levenshtein similarity between output and expected.
 *
 * @example
 * ```ts
 * import { scorers } from 'viteval';
 *
 * // Default
 * scorers: [scorers.levenshtein()]
 *
 * // With threshold
 * scorers: [scorers.levenshtein({ threshold: 0.8 })]
 * ```
 */
export function levenshteinScorer(options?: LevenshteinOptions): Scorer {
  const { threshold = 0 } = options ?? {};

  return createScorer({
    name: 'Levenshtein',
    score: ({ output, expected }) => {
      const a = String(output);
      const b = String(expected);
      const distance = levenshtein(a, b);
      const similarity = levenshteinSimilarity(a, b);

      return {
        metadata: { distance },
        score: similarity >= threshold ? similarity : 0,
      };
    },
  });
}
