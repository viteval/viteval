import { describe, expect, it } from 'vitest';
import { jsonDiff } from './json-diff';

describe('jsonDiff', () => {
  it('should return 1 for identical objects', async () => {
    const result = await jsonDiff({
      input: '',
      output: { a: 1, b: 'hello' },
      expected: { a: 1, b: 'hello' },
    });
    expect(result.score).toBe(1);
  });

  it('should return a partial score for nested objects with differences', async () => {
    const result = await jsonDiff({
      input: '',
      output: { a: { x: 1 }, b: 'hello' },
      expected: { a: { x: 2 }, b: 'hello' },
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });

  it('should handle identical arrays', async () => {
    const result = await jsonDiff({
      input: '',
      output: [1, 2, 3],
      expected: [1, 2, 3],
    });
    expect(result.score).toBe(1);
  });

  it('should handle arrays with different lengths', async () => {
    const result = await jsonDiff({
      input: '',
      output: [1, 2],
      expected: [1, 2, 3],
    });
    expect(result.score).toBeLessThan(1);
  });

  it('should handle mixed types via stringify comparison', async () => {
    const result = await jsonDiff({
      input: '',
      output: 42,
      expected: '42',
    });
    // number vs string after parse: "42" parses to number 42
    expect(result.score).toBe(1);
  });

  it('should handle identical strings', async () => {
    const result = await jsonDiff({
      input: '',
      output: 'hello',
      expected: 'hello',
    });
    expect(result.score).toBe(1);
  });

  it('should handle identical numbers', async () => {
    const result = await jsonDiff({
      input: '',
      output: 42,
      expected: 42,
    });
    expect(result.score).toBe(1);
  });

  it('should return 1 for both null', async () => {
    const result = await jsonDiff({
      input: '',
      output: null,
      expected: null,
    });
    expect(result.score).toBe(1);
  });

  it('should return 0 for null vs value', async () => {
    const result = await jsonDiff({
      input: '',
      output: null,
      expected: { a: 1 },
    });
    expect(result.score).toBe(0);
  });

  it('should auto-parse JSON strings', async () => {
    const result = await jsonDiff({
      input: '',
      output: '{"a":1}',
      expected: { a: 1 },
    });
    expect(result.score).toBe(1);
  });

  it('should have the correct name', () => {
    expect(jsonDiff.name).toBe('JsonDiff');
  });
});
