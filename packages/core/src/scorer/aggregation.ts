import type { Score } from '#/types';

/**
 * Get the mean score from an array of scores.
 *
 * @param results - The array of scores.
 * @returns The mean score, or 0 if the array is empty.
 */
export function getMeanScore(results: Score[]): number {
  if (results.length === 0) {
    return 0;
  }

  return (
    results.reduce((acc, result) => acc + defaultScore(result.score), 0) /
    results.length
  );
}

/**
 * Get the median score from an array of scores.
 *
 * @param results - The array of scores.
 * @returns The median score, or 0 if the array is empty.
 */
export function getMedianScore(results: Score[]): number {
  if (results.length === 0) {
    return 0;
  }

  const sortedScores = results
    .map((result) => defaultScore(result.score))
    .sort((a, b) => a - b);

  const mid = Math.floor(sortedScores.length / 2);

  if (sortedScores.length % 2 === 0) {
    // Even number of scores - average the two middle values
    return (sortedScores[mid - 1] + sortedScores[mid]) / 2;
  }

  // Odd number of scores - return the middle value
  return sortedScores[mid];
}

/**
 * Get the sum score from an array of scores.
 *
 * @param results - The array of scores.
 * @returns The sum score, or 0 if the array is empty.
 */
export function getSumScore(results: Score[]): number {
  if (results.length === 0) {
    return 0;
  }

  return results.reduce((acc, result) => acc + defaultScore(result.score), 0);
}

/*
|------------------
| Internals
|------------------
*/

function defaultScore(score?: number | null) {
  return score ?? 0;
}
