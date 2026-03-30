import { describe, expect, it } from 'vitest';
import { listContains } from './list-contains';

describe('listContains', () => {
  it('should return 1 for identical lists', async () => {
    const result = await listContains({
      expected: ['apple', 'banana', 'cherry'],
      input: '',
      output: ['apple', 'banana', 'cherry'],
    });
    expect(result.score).toBe(1);
  });

  it('should return 1 for reordered lists', async () => {
    const result = await listContains({
      expected: ['apple', 'banana', 'cherry'],
      input: '',
      output: ['banana', 'apple', 'cherry'],
    });
    expect(result.score).toBe(1);
  });

  it('should return a partial score for partial overlap', async () => {
    const result = await listContains({
      expected: ['apple', 'banana', 'cherry'],
      input: '',
      output: ['apple', 'banana'],
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });

  it('should return 1 for both empty lists', async () => {
    const result = await listContains({
      expected: [],
      input: '',
      output: [],
    });
    expect(result.score).toBe(1);
  });

  it('should return 0 for one empty list', async () => {
    const result = await listContains({
      expected: ['apple'],
      input: '',
      output: [],
    });
    expect(result.score).toBe(0);
  });

  it('should handle single items', async () => {
    const result = await listContains({
      expected: ['apple'],
      input: '',
      output: ['apple'],
    });
    expect(result.score).toBe(1);
  });

  it('should handle string inputs split by newline', async () => {
    const result = await listContains({
      expected: 'apple\nbanana',
      input: '',
      output: 'apple\nbanana',
    });
    expect(result.score).toBe(1);
  });

  it('should have the correct name', () => {
    expect(listContains.name).toBe('ListContains');
  });
});
