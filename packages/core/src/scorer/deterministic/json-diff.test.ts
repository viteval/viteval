import { describe, expect, it } from 'vitest';
import { jsonDiff } from './json-diff';

describe('jsonDiff', () => {
  const scorer = jsonDiff();

  it('should return 1 for identical objects', async () => {
    const result = await scorer({
      expected: { a: 1, b: 'hello' },
      input: '',
      output: { a: 1, b: 'hello' },
    });
    expect(result.score).toBe(1);
  });

  it('should return a partial score for nested objects with differences', async () => {
    const result = await scorer({
      expected: { a: { x: 2 }, b: 'hello' },
      input: '',
      output: { a: { x: 1 }, b: 'hello' },
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });

  it('should handle identical arrays', async () => {
    const result = await scorer({
      expected: [1, 2, 3],
      input: '',
      output: [1, 2, 3],
    });
    expect(result.score).toBe(1);
  });

  it('should handle arrays with different lengths', async () => {
    const result = await scorer({
      expected: [1, 2, 3],
      input: '',
      output: [1, 2],
    });
    expect(result.score).toBeLessThan(1);
  });

  it('should handle mixed types via stringify comparison', async () => {
    const result = await scorer({
      expected: '42',
      input: '',
      output: 42,
    });
    // Number vs string after parse: "42" parses to number 42
    expect(result.score).toBe(1);
  });

  it('should handle identical strings', async () => {
    const result = await scorer({
      expected: 'hello',
      input: '',
      output: 'hello',
    });
    expect(result.score).toBe(1);
  });

  it('should handle identical numbers', async () => {
    const result = await scorer({
      expected: 42,
      input: '',
      output: 42,
    });
    expect(result.score).toBe(1);
  });

  it('should return 1 for both null', async () => {
    const result = await scorer({
      expected: null,
      input: '',
      output: null,
    });
    expect(result.score).toBe(1);
  });

  it('should return 0 for null vs value', async () => {
    const result = await scorer({
      expected: { a: 1 },
      input: '',
      output: null,
    });
    expect(result.score).toBe(0);
  });

  it('should auto-parse JSON strings', async () => {
    const result = await scorer({
      expected: { a: 1 },
      input: '',
      output: '{"a":1}',
    });
    expect(result.score).toBe(1);
  });

  it('should have the correct name', () => {
    expect(scorer.name).toBe('JsonDiff');
  });

  describe('with threshold', () => {
    it('should return 0 when score is below threshold', async () => {
      const strict = jsonDiff({ threshold: 0.9 });
      const result = await strict({
        expected: { a: 1, b: 'world' },
        input: '',
        output: { a: 1, b: 'hello' },
      });
      expect(result.score).toBe(0);
    });

    it('should pass through scores at or above the threshold', async () => {
      const loose = jsonDiff({ threshold: 0.5 });
      const result = await loose({
        expected: { a: 1, b: 'hello' },
        input: '',
        output: { a: 1, b: 'hello' },
      });
      expect(result.score).toBe(1);
    });

    it('should return 1 for identical values regardless of threshold', async () => {
      const strict = jsonDiff({ threshold: 0.99 });
      const result = await strict({
        expected: { a: 1 },
        input: '',
        output: { a: 1 },
      });
      expect(result.score).toBe(1);
    });

    it('should preserve the scorer name', async () => {
      const configured = jsonDiff({ threshold: 0.5 });
      const result = await configured({
        expected: { a: 1 },
        input: '',
        output: { a: 1 },
      });
      expect(result.name).toBe('JsonDiff');
    });

    it('should behave like default when threshold is 0', async () => {
      const configured = jsonDiff({ threshold: 0 });
      const defaultResult = await scorer({
        expected: { a: 1, b: 'abc' },
        input: '',
        output: { a: 1, b: 'xyz' },
      });
      const configuredResult = await configured({
        expected: { a: 1, b: 'abc' },
        input: '',
        output: { a: 1, b: 'xyz' },
      });
      expect(configuredResult.score).toBe(defaultResult.score);
    });
  });
});
