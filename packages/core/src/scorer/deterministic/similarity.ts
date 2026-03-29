import levenshtein from 'js-levenshtein';

/**
 * Compute the Levenshtein similarity between two strings as a value in [0, 1].
 *
 * @param a - First string
 * @param b - Second string
 * @returns Similarity score where 1 means identical and 0 means completely different
 */
export function levenshteinSimilarity(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  const distance = levenshtein(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}
