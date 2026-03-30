import { describe, expect, it } from 'vitest';
import { numericDiff } from './numeric-diff';

describe('numericDiff', () => {
  const scorer = numericDiff();

  it('should return 1 for equal numbers', async () => {
    const result = await scorer({ expected: 10, input: '', output: 10 });
    expect(result.score).toBe(1);
  });

  it('should return a partial score for different numbers', async () => {
    const result = await scorer({ expected: 12, input: '', output: 10 });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });

  it('should return 1 when both are zero', async () => {
    const result = await scorer({ expected: 0, input: '', output: 0 });
    expect(result.score).toBe(1);
  });

  it('should handle string numbers', async () => {
    const result = await scorer({
      expected: '10',
      input: '',
      output: '10',
    });
    expect(result.score).toBe(1);
  });

  it('should return 0 for non-numeric strings', async () => {
    const result = await scorer({
      expected: 'def',
      input: '',
      output: 'abc',
    });
    expect(result.score).toBe(0);
  });

  it('should return 0 for completely different numbers', async () => {
    const result = await scorer({ expected: 0, input: '', output: 100 });
    expect(result.score).toBe(0);
  });

  it('should clamp score to [0,1]', async () => {
    const result = await scorer({ expected: 5, input: '', output: -5 });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('should have the correct name', () => {
    expect(scorer.name).toBe('NumericDiff');
  });

  describe('with tolerance', () => {
    it('should return 1 when difference is within tolerance', async () => {
      const tolerant = numericDiff({ tolerance: 2 });
      const result = await tolerant({ expected: 12, input: '', output: 10 });
      expect(result.score).toBe(1);
    });

    it('should return 1 when difference equals tolerance', async () => {
      const tolerant = numericDiff({ tolerance: 5 });
      const result = await tolerant({ expected: 15, input: '', output: 10 });
      expect(result.score).toBe(1);
    });

    it('should return similarity score when difference exceeds tolerance', async () => {
      const tolerant = numericDiff({ tolerance: 1 });
      const result = await tolerant({ expected: 15, input: '', output: 10 });
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(1);
    });

    it('should behave like default when tolerance is 0', async () => {
      const configured = numericDiff({ tolerance: 0 });
      const defaultResult = await scorer({
        expected: 12,
        input: '',
        output: 10,
      });
      const configuredResult = await configured({
        expected: 12,
        input: '',
        output: 10,
      });
      expect(configuredResult.score).toBe(defaultResult.score);
    });

    it('should still return 0 for non-numeric input with tolerance', async () => {
      const tolerant = numericDiff({ tolerance: 100 });
      const result = await tolerant({
        expected: 'def',
        input: '',
        output: 'abc',
      });
      expect(result.score).toBe(0);
    });

    it('should preserve the scorer name', async () => {
      const configured = numericDiff({ tolerance: 5 });
      const result = await configured({ expected: 10, input: '', output: 10 });
      expect(result.name).toBe('NumericDiff');
    });

    it('should handle negative number differences within tolerance', async () => {
      const tolerant = numericDiff({ tolerance: 3 });
      const result = await tolerant({ expected: 2, input: '', output: -1 });
      expect(result.score).toBe(1);
    });
  });
});
