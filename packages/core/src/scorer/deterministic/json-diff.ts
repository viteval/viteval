import {
  isArray,
  isNil,
  isNumber,
  isPlainObject,
  isString,
} from '@viteval/internal';
import type { Scorer } from '#/types';
import { createScorer } from '#/scorer/custom';
import { levenshteinSimilarity, numericSimilarity } from './similarity';

/**
 * Options for the JsonDiff scorer.
 */
export interface JsonDiffOptions {
  /**
   * Minimum similarity threshold. Scores below this value are returned as 0.
   *
   * @default 0
   */
  threshold?: number;
}

/**
 * Create a JSON diff scorer.
 *
 * @param options - Optional configuration.
 * @returns A scorer that recursively compares JSON values.
 *
 * @example
 * ```ts
 * import { scorers } from 'viteval';
 *
 * // Default
 * scorers: [scorers.jsonDiff()]
 *
 * // With threshold
 * scorers: [scorers.jsonDiff({ threshold: 0.9 })]
 * ```
 */
export function jsonDiff(options?: JsonDiffOptions): Scorer {
  const { threshold = 0 } = options ?? {};

  return createScorer({
    name: 'JsonDiff',
    score: ({ output, expected }) => {
      const score = deepCompare(tryParseJson(output), tryParseJson(expected));
      return { score: score >= threshold ? score : 0 };
    },
  });
}

/**
 * Attempt to parse a value as JSON if it is a string, otherwise return as-is.
 *
 * @private
 */
function tryParseJson(value: unknown): unknown {
  if (isString(value)) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

/**
 * Recursively compare two values and return a similarity score in [0, 1].
 *
 * @private
 */
function deepCompare(a: unknown, b: unknown): number {
  if (isNil(a) && isNil(b)) {
    return 1;
  }
  if (isNil(a) || isNil(b)) {
    return 0;
  }

  if (isNumber(a) && isNumber(b)) {
    return numericSimilarity(a, b);
  }

  if (isString(a) && isString(b)) {
    return levenshteinSimilarity(a, b);
  }

  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b ? 1 : 0;
  }

  if (isArray(a) && isArray(b)) {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) {
      return 1;
    }

    const minLen = Math.min(a.length, b.length);
    let total = 0;
    for (let i = 0; i < minLen; i++) {
      total += deepCompare(a[i], b[i]);
    }
    return total / maxLen;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    const allKeys = [...new Set([...keysA, ...keysB])];

    if (allKeys.length === 0) {
      return 1;
    }

    let total = 0;
    for (const key of allKeys) {
      total += deepCompare(a[key], b[key]);
    }
    return total / allKeys.length;
  }

  // Type mismatch: stringify and compare as strings
  const strA = JSON.stringify(a);
  const strB = JSON.stringify(b);
  return levenshteinSimilarity(strA, strB);
}
