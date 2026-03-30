import { describe, expect, it } from 'vitest';
import { levenshteinScorer } from './levenshtein';

describe('levenshteinScorer', () => {
  const scorer = levenshteinScorer();

  it('should return 1 for identical strings', async () => {
    const result = await scorer({
      expected: 'hello',
      input: '',
      output: 'hello',
    });
    expect(result.score).toBe(1);
  });

  it('should return 0 for completely different single chars', async () => {
    const result = await scorer({
      expected: 'b',
      input: '',
      output: 'a',
    });
    expect(result.score).toBe(0);
  });

  it('should return a partial score for partially similar strings', async () => {
    const result = await scorer({
      expected: 'sitting',
      input: '',
      output: 'kitten',
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });

  it('should return 1 for two empty strings', async () => {
    const result = await scorer({
      expected: '',
      input: '',
      output: '',
    });
    expect(result.score).toBe(1);
  });

  it('should return 0 for empty vs non-empty string', async () => {
    const result = await scorer({
      expected: 'abc',
      input: '',
      output: '',
    });
    expect(result.score).toBe(0);
  });

  it('should handle single character strings', async () => {
    const result = await scorer({
      expected: 'a',
      input: '',
      output: 'a',
    });
    expect(result.score).toBe(1);
  });

  it('should include distance in metadata', async () => {
    const result = await scorer({
      expected: 'axc',
      input: '',
      output: 'abc',
    });
    expect(result.metadata?.distance).toBe(1);
  });

  it('should have the correct name', () => {
    expect(scorer.name).toBe('Levenshtein');
  });

  describe('with threshold', () => {
    it('should return 0 when score is below threshold', async () => {
      const strict = levenshteinScorer({ threshold: 0.8 });
      const result = await strict({
        expected: 'sitting',
        input: '',
        output: 'kitten',
      });
      // Kitten/sitting similarity is ~0.57, below 0.8 threshold
      expect(result.score).toBe(0);
    });

    it('should pass through scores at or above the threshold', async () => {
      const loose = levenshteinScorer({ threshold: 0.3 });
      const result = await loose({
        expected: 'sitting',
        input: '',
        output: 'kitten',
      });
      expect(result.score).toBeGreaterThan(0);
    });

    it('should return the raw score when threshold is 0', async () => {
      const configured = levenshteinScorer({ threshold: 0 });
      const result = await configured({
        expected: 'sitting',
        input: '',
        output: 'kitten',
      });
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(1);
    });

    it('should return 1 for identical strings regardless of threshold', async () => {
      const strict = levenshteinScorer({ threshold: 0.99 });
      const result = await strict({
        expected: 'hello',
        input: '',
        output: 'hello',
      });
      expect(result.score).toBe(1);
    });

    it('should preserve the scorer name', async () => {
      const configured = levenshteinScorer({ threshold: 0.5 });
      const result = await configured({
        expected: 'hello',
        input: '',
        output: 'hello',
      });
      expect(result.name).toBe('Levenshtein');
    });

    it('should still include metadata', async () => {
      const configured = levenshteinScorer({ threshold: 0.5 });
      const result = await configured({
        expected: 'axc',
        input: '',
        output: 'abc',
      });
      expect(result.metadata?.distance).toBe(1);
    });
  });
});
