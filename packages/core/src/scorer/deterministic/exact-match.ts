import { pipe } from 'massaman/fp';
import { when } from 'massaman/function';
import type { Scorer } from '#/types';
import { createScorer } from '#/scorer/custom';

/**
 * Options for the ExactMatch scorer.
 */
export interface ExactMatchOptions {
  /**
   * Whether to perform a case-sensitive comparison.
   *
   * @default true
   */
  caseSensitive?: boolean;
  /**
   * Whether to trim whitespace from both values before comparison.
   *
   * @default false
   */
  trim?: boolean;
}

/**
 * Create an exact match scorer.
 *
 * @param options - Optional configuration.
 * @returns A scorer that checks for exact string equality between output and expected.
 *
 * @example
 * ```ts
 * import { scorers } from 'viteval';
 *
 * // Default (case-sensitive, no trim)
 * scorers: [scorers.exactMatch()]
 *
 * // Case-insensitive with trim
 * scorers: [scorers.exactMatch({ caseSensitive: false, trim: true })]
 * ```
 */
export function exactMatch(options?: ExactMatchOptions): Scorer {
  const { caseSensitive = true, trim = false } = options ?? {};
  const compareValue = (value: unknown) =>
    pipe(
      normalize(value),
      when<string>(
        () => trim,
        (text) => text.trim()
      ),
      when<string>(
        () => !caseSensitive,
        (text) => text.toLowerCase()
      )
    );

  return createScorer({
    name: 'ExactMatch',
    score: ({ output, expected }) => ({
      score: Number(compareValue(output) === compareValue(expected)),
    }),
  });
}

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
