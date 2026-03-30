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
    score: normalize(output) === normalize(expected) ? 1 : 0,
  }),
});

/**
 * Normalize a value to a string for exact comparison.
 * Uses JSON.stringify for objects to avoid `[object Object]` coercion.
 *
 * @private
 */
function normalize(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}
