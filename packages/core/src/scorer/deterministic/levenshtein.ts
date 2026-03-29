import levenshtein from 'js-levenshtein';
import { createScorer } from '#/scorer/custom';

/**
 * Scores based on Levenshtein similarity between output and expected.
 *
 * @example
 * ```ts
 * import { levenshteinScorer } from '@viteval/core';
 *
 * const result = await levenshteinScorer({ input: 'q', output: 'kitten', expected: 'sitting' });
 * // result.score is between 0 and 1
 * ```
 */
export const levenshteinScorer = createScorer({
  name: 'Levenshtein',
  score: ({ output, expected }) => {
    const a = String(output);
    const b = String(expected);

    if (a.length === 0 && b.length === 0) {
      return { score: 1 };
    }

    const distance = levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length);

    return {
      score: 1 - distance / maxLen,
      metadata: { distance },
    };
  },
});
