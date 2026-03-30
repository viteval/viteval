import { describe, expect, it } from 'vitest';
import { levenshteinScorer } from './levenshtein';

describe('levenshteinScorer', () => {
  it('should return 1 for identical strings', async () => {
    const result = await levenshteinScorer({
      input: '',
      output: 'hello',
      expected: 'hello',
    });
    expect(result.score).toBe(1);
  });

  it('should return 0 for completely different single chars', async () => {
    const result = await levenshteinScorer({
      input: '',
      output: 'a',
      expected: 'b',
    });
    expect(result.score).toBe(0);
  });

  it('should return a partial score for partially similar strings', async () => {
    const result = await levenshteinScorer({
      input: '',
      output: 'kitten',
      expected: 'sitting',
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });

  it('should return 1 for two empty strings', async () => {
    const result = await levenshteinScorer({
      input: '',
      output: '',
      expected: '',
    });
    expect(result.score).toBe(1);
  });

  it('should return 0 for empty vs non-empty string', async () => {
    const result = await levenshteinScorer({
      input: '',
      output: '',
      expected: 'abc',
    });
    expect(result.score).toBe(0);
  });

  it('should handle single character strings', async () => {
    const result = await levenshteinScorer({
      input: '',
      output: 'a',
      expected: 'a',
    });
    expect(result.score).toBe(1);
  });

  it('should include distance in metadata', async () => {
    const result = await levenshteinScorer({
      input: '',
      output: 'abc',
      expected: 'axc',
    });
    expect(result.metadata?.distance).toBe(1);
  });

  it('should have the correct name', () => {
    expect(levenshteinScorer.name).toBe('Levenshtein');
  });
});
