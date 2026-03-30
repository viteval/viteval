import { clamp, isArray, isString } from '@viteval/internal';
import { linearSumAssignment } from 'linear-sum-assignment';
import type { Extra, Scorer } from '#/types';
import { createScorer } from '#/scorer/custom';
import { levenshteinSimilarity } from './similarity';

/**
 * Options for the ListContains scorer.
 */
export interface ListContainsOptions {
  /**
   * Minimum similarity threshold. Scores below this value are returned as 0.
   *
   * @default 0
   */
  threshold?: number;
}

/**
 * Create a list containment scorer.
 *
 * @param options - Optional configuration.
 * @returns A scorer that uses optimal pairwise matching (Hungarian algorithm) between two lists.
 *
 * @example
 * ```ts
 * import { scorers } from 'viteval';
 *
 * // Default
 * scorers: [scorers.listContains()]
 *
 * // With threshold
 * scorers: [scorers.listContains({ threshold: 0.8 })]
 * ```
 */
export function listContains(
  options?: ListContainsOptions
): Scorer<unknown, Extra> {
  const { threshold = 0 } = options ?? {};

  return createScorer({
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
        const score = levenshteinSimilarity(outputList[0]!, expectedList[0]!);
        return { score: score >= threshold ? score : 0 };
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
      const clampedScore = clamp(score, 0, 1);

      return { score: clampedScore >= threshold ? clampedScore : 0 };
    },
  });
}

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
