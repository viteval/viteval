import { createScorer } from '#/scorer/custom';
import { numericSimilarity } from './similarity';

/**
 * Scores based on numeric difference between output and expected.
 *
 * @example
 * ```ts
 * import { numericDiff } from '@viteval/core';
 *
 * const result = await numericDiff({ input: 'q', output: 10, expected: 12 });
 * // result.score is between 0 and 1
 * ```
 */
export const numericDiff = createScorer({
  name: 'NumericDiff',
  score: ({ output, expected }) => {
    const a = Number(output);
    const b = Number(expected);

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return { metadata: { error: 'non-numeric input' }, score: 0 };
    }

    return { score: numericSimilarity(a, b) };
  },
});
