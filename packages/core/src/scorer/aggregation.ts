import type { Score } from '#/types';

/**
 * Get the mean score from an array of scores.
 *
 * @param results - The array of scores.
 * @returns The mean score.
 */
export function getMeanScore(results: Score[]): number {
  return (
    results.reduce((acc, result) => acc + defaultScore(result.score), 0) /
    results.length
  );
}

/**
 * Get the median score from an array of scores.
 *
 * @param results - The array of scores.
 * @returns The median score.
 */
export function getMedianScore(results: Score[]): number {
  return (
    results.sort((a, b) => defaultScore(a.score) - defaultScore(b.score))[
      Math.floor(results.length / 2)
    ].score ?? 0
  );
}

/**
 * Get the sum score from an array of scores.
 *
 * @param results - The array of scores.
 * @returns The sum score.
 */
export function getSumScore(results: Score[]): number {
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
