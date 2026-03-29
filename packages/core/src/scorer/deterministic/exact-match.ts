import { createScorer } from '#/scorer/custom';

/**
 * Scores based on exact string match between output and expected.
 *
 * @example
 * ```ts
 * import { exactMatch } from '@viteval/core';
 *
 * const result = await exactMatch({ input: 'q', output: 'hello', expected: 'hello' });
 * // result.score === 1
 * ```
 */
export const exactMatch = createScorer({
  name: 'ExactMatch',
  score: ({ output, expected }) => ({
    score: String(output) === String(expected) ? 1 : 0,
  }),
});
