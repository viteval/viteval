import levenshtein from 'js-levenshtein';
import { createScorer } from '#/scorer/custom';
import { levenshteinSimilarity } from './similarity';

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
    const distance = levenshtein(a, b);

    return {
      score: levenshteinSimilarity(a, b),
      metadata: { distance },
    };
  },
});
