import { meanBy, medianBy, sumBy } from 'massaman/math';
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

  return meanBy(results, (result) => result.score ?? 0);
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

  return medianBy(results, (result) => result.score ?? 0);
}

/**
 * Get the sum score from an array of scores.
 *
 * @param results - The array of scores.
 * @returns The sum score, or 0 if the array is empty.
 */
export function getSumScore(results: Score[]): number {
  return sumBy(results, (result) => result.score ?? 0);
}
