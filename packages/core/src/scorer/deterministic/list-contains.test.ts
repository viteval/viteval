import { describe, expect, it } from 'vitest';
import { listContains } from './list-contains';

describe('listContains', () => {
  const scorer = listContains();

  it('should return 1 for identical lists', async () => {
    const result = await scorer({
      expected: ['apple', 'banana', 'cherry'],
      input: '',
      output: ['apple', 'banana', 'cherry'],
    });
    expect(result.score).toBe(1);
  });

  it('should return 1 for reordered lists', async () => {
    const result = await scorer({
      expected: ['apple', 'banana', 'cherry'],
      input: '',
      output: ['banana', 'apple', 'cherry'],
    });
    expect(result.score).toBe(1);
  });

  it('should return a partial score for partial overlap', async () => {
    const result = await scorer({
      expected: ['apple', 'banana', 'cherry'],
      input: '',
      output: ['apple', 'banana'],
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });

  it('should return 1 for both empty lists', async () => {
    const result = await scorer({
      expected: [],
      input: '',
      output: [],
    });
    expect(result.score).toBe(1);
  });

  it('should return 0 for one empty list', async () => {
    const result = await scorer({
      expected: ['apple'],
      input: '',
      output: [],
    });
    expect(result.score).toBe(0);
  });

  it('should handle single items', async () => {
    const result = await scorer({
      expected: ['apple'],
      input: '',
      output: ['apple'],
    });
    expect(result.score).toBe(1);
  });

  it('should handle string inputs split by newline', async () => {
    const result = await scorer({
      expected: 'apple\nbanana',
      input: '',
      output: 'apple\nbanana',
    });
    expect(result.score).toBe(1);
  });

  it('should have the correct name', () => {
    expect(scorer.name).toBe('ListContains');
  });

  describe('with threshold', () => {
    it('should return 0 when score is below threshold', async () => {
      const strict = listContains({ threshold: 0.9 });
      const result = await strict({
        expected: ['apple', 'banana', 'cherry'],
        input: '',
        output: ['apple', 'banana'],
      });
      // 2/3 match ≈ 0.67, below 0.9 threshold
      expect(result.score).toBe(0);
    });

    it('should pass through scores at or above the threshold', async () => {
      const loose = listContains({ threshold: 0.5 });
      const result = await loose({
        expected: ['apple', 'banana', 'cherry'],
        input: '',
        output: ['apple', 'banana'],
      });
      expect(result.score).toBeGreaterThan(0);
    });

    it('should return 1 for identical lists regardless of threshold', async () => {
      const strict = listContains({ threshold: 0.99 });
      const result = await strict({
        expected: ['apple', 'banana'],
        input: '',
        output: ['apple', 'banana'],
      });
      expect(result.score).toBe(1);
    });

    it('should preserve the scorer name', async () => {
      const configured = listContains({ threshold: 0.5 });
      const result = await configured({
        expected: ['apple'],
        input: '',
        output: ['apple'],
      });
      expect(result.name).toBe('ListContains');
    });

    it('should behave like default when threshold is 0', async () => {
      const configured = listContains({ threshold: 0 });
      const defaultResult = await scorer({
        expected: ['apple', 'banana'],
        input: '',
        output: ['apple'],
      });
      const configuredResult = await configured({
        expected: ['apple', 'banana'],
        input: '',
        output: ['apple'],
      });
      expect(configuredResult.score).toBe(defaultResult.score);
    });

    it('should apply threshold to single item comparisons', async () => {
      const strict = listContains({ threshold: 0.9 });
      const result = await strict({
        expected: ['apples'],
        input: '',
        output: ['apple'],
      });
      // Similarity of "apple" vs "apples" is ~0.83, below 0.9
      expect(result.score).toBe(0);
    });
  });
});
