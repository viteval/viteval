import { clamp, isArray, isString } from '@viteval/internal';
import { linearSumAssignment } from 'linear-sum-assignment';
import { createScorer } from '#/scorer/custom';
import { levenshteinSimilarity } from './similarity';

/**
 * Scores based on optimal pairwise matching between two lists using
 * Levenshtein similarity and the Hungarian algorithm.
 *
 * @example
 * ```ts
 * import { scorers } from '@viteval/core';
 *
 * const result = await scorers.listContains({
 *   input: 'q',
 *   output: ['apple', 'banana'],
 *   expected: ['banana', 'apple'],
 * });
 * // result.score === 1
 * ```
 */
export const listContains = createScorer({
  name: 'ListContains',
  score: ({ output, expected }) => {
    const outputList = toStringArray(output);
    const expectedList = toStringArray(expected);

    if (outputList.length === 0 && expectedList.length === 0) {
      return { score: 1 };
    }

    if (outputList.length === 0 || expectedList.length === 0) {
      return { score: 0 };
    }

    const rows = outputList.length;
    const cols = expectedList.length;

    // Handle 1x1 case directly (library doesn't support 1x1 matrices)
    if (rows === 1 && cols === 1) {
      return { score: levenshteinSimilarity(outputList[0]!, expectedList[0]!) };
    }

    const maxDim = Math.max(rows, cols);

    // Build similarity matrix padded to square
    const similarityMatrix: number[][] = [];
    for (let i = 0; i < maxDim; i++) {
      const row: number[] = [];
      for (let j = 0; j < maxDim; j++) {
        if (i < rows && j < cols) {
          row.push(levenshteinSimilarity(outputList[i]!, expectedList[j]!));
        } else {
          row.push(0);
        }
      }
      similarityMatrix.push(row);
    }

    const { rowAssignments } = linearSumAssignment(similarityMatrix, {
      maximaze: true,
    });

    let totalSimilarity = 0;
    for (let i = 0; i < rows; i++) {
      const j = rowAssignments[i]!;
      if (j < cols) {
        totalSimilarity += similarityMatrix[i]![j]!;
      }
    }

    const score =
      totalSimilarity / Math.max(outputList.length, expectedList.length);

    return { score: clamp(score, 0, 1) };
  },
});

/**
 * Coerce an unknown value into a string array for list comparison.
 *
 * @private
 */
function toStringArray(value: unknown): string[] {
  if (isArray(value)) {
    return value.map(String);
  }

  if (isString(value)) {
    try {
      const parsed = JSON.parse(value);
      if (isArray(parsed)) {
        return parsed.map(String);
      }
    } catch {
      // Split by newline
    }
    return value
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  return [String(value)];
}
