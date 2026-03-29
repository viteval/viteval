import { isArray, isNil, isNumber, isPlainObject, isString, clamp } from '@viteval/internal';
import { createScorer } from '#/scorer/custom';
import { levenshteinSimilarity } from './similarity';

function numericSimilarity(a: number, b: number): number {
  if (a === 0 && b === 0) return 1;
  const maxAbs = Math.max(Math.abs(a), Math.abs(b));
  return clamp(1 - Math.abs(a - b) / maxAbs, 0, 1);
}

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

function deepCompare(a: unknown, b: unknown): number {
  const parsedA = tryParseJson(a);
  const parsedB = tryParseJson(b);

  if (isNil(parsedA) && isNil(parsedB)) return 1;
  if (isNil(parsedA) || isNil(parsedB)) return 0;

  if (isNumber(parsedA) && isNumber(parsedB)) {
    return numericSimilarity(parsedA, parsedB);
  }

  if (isString(parsedA) && isString(parsedB)) {
    return levenshteinSimilarity(parsedA, parsedB);
  }

  if (isArray(parsedA) && isArray(parsedB)) {
    const maxLen = Math.max(parsedA.length, parsedB.length);
    if (maxLen === 0) return 1;

    let total = 0;
    for (let i = 0; i < maxLen; i++) {
      if (i < parsedA.length && i < parsedB.length) {
        total += deepCompare(parsedA[i], parsedB[i]);
      }
    }
    return total / maxLen;
  }

  if (isPlainObject(parsedA) && isPlainObject(parsedB)) {
    const keysA = Object.keys(parsedA);
    const keysB = Object.keys(parsedB);
    const allKeys = [...new Set([...keysA, ...keysB])];

    if (allKeys.length === 0) return 1;

    let total = 0;
    for (const key of allKeys) {
      total += deepCompare(parsedA[key], parsedB[key]);
    }
    return total / allKeys.length;
  }

  // Type mismatch: stringify and compare as strings
  const strA = JSON.stringify(parsedA);
  const strB = JSON.stringify(parsedB);
  return levenshteinSimilarity(strA, strB);
}

/**
 * Scores based on recursive deep comparison of JSON values.
 *
 * @example
 * ```ts
 * import { jsonDiff } from '@viteval/core';
 *
 * const result = await jsonDiff({
 *   input: 'q',
 *   output: { name: 'Alice' },
 *   expected: { name: 'Alice' },
 * });
 * // result.score === 1
 * ```
 */
export const jsonDiff = createScorer({
  name: 'JsonDiff',
  score: ({ output, expected }) => ({
    score: deepCompare(output, expected),
  }),
});
