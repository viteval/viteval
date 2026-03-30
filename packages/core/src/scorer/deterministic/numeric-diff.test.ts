import { describe, expect, it } from 'vitest';
import { numericDiff } from './numeric-diff';

describe('numericDiff', () => {
  it('should return 1 for equal numbers', async () => {
    const result = await numericDiff({ expected: 10, input: '', output: 10 });
    expect(result.score).toBe(1);
  });

  it('should return a partial score for different numbers', async () => {
    const result = await numericDiff({ expected: 12, input: '', output: 10 });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });

  it('should return 1 when both are zero', async () => {
    const result = await numericDiff({ expected: 0, input: '', output: 0 });
    expect(result.score).toBe(1);
  });

  it('should handle string numbers', async () => {
    const result = await numericDiff({
      expected: '10',
      input: '',
      output: '10',
    });
    expect(result.score).toBe(1);
  });

  it('should return 0 for non-numeric strings', async () => {
    const result = await numericDiff({
      expected: 'def',
      input: '',
      output: 'abc',
    });
    expect(result.score).toBe(0);
  });

  it('should return 0 for completely different numbers', async () => {
    const result = await numericDiff({ expected: 0, input: '', output: 100 });
    expect(result.score).toBe(0);
  });

  it('should clamp score to [0,1]', async () => {
    const result = await numericDiff({ expected: 5, input: '', output: -5 });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('should have the correct name', () => {
    expect(numericDiff.name).toBe('NumericDiff');
  });
});
