import type { Scorer } from '#/types';
import { createScorer } from '#/scorer/custom';
import { numericSimilarity } from './similarity';

/**
 * Options for the NumericDiff scorer.
 */
export interface NumericDiffOptions {
  /**
   * Absolute tolerance. If the absolute difference between output and expected
   * is less than or equal to this value, the score is 1.
   *
   * @default 0
   */
  tolerance?: number;
}

/**
 * Create a numeric difference scorer.
 *
 * @param options - Optional configuration.
 * @returns A scorer that computes similarity based on numeric difference.
 *
 * @example
 * ```ts
 * import { scorers } from 'viteval';
 *
 * // Default
 * scorers: [scorers.numericDiff()]
 *
 * // With tolerance (scores 1 if difference <= 2)
 * scorers: [scorers.numericDiff({ tolerance: 2 })]
 * ```
 */
export function numericDiff(options?: NumericDiffOptions): Scorer {
  const { tolerance = 0 } = options ?? {};

  return createScorer({
    name: 'NumericDiff',
    score: ({ output, expected }) => {
      const a = Number(output);
      const b = Number(expected);

      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return { metadata: { error: 'non-numeric input' }, score: 0 };
      }

      if (tolerance > 0 && Math.abs(a - b) <= tolerance) {
        return { score: 1 };
      }

      return { score: numericSimilarity(a, b) };
    },
  });
}
