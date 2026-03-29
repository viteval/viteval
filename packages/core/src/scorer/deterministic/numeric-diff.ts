import { clamp } from '@viteval/internal';
import { createScorer } from '#/scorer/custom';

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
      return { score: 0, metadata: { error: 'non-numeric input' } };
    }

    if (a === 0 && b === 0) {
      return { score: 1 };
    }

    const maxAbs = Math.max(Math.abs(a), Math.abs(b));
    const score = clamp(1 - Math.abs(a - b) / maxAbs, 0, 1);

    return { score };
  },
});
