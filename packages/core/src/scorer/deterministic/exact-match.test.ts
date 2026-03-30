import { describe, expect, it } from 'vitest';
import { exactMatch } from './exact-match';

describe('exactMatch', () => {
  const scorer = exactMatch();

  it('should return 1 for matching strings', async () => {
    const result = await scorer({
      expected: 'hello',
      input: '',
      output: 'hello',
    });
    expect(result.score).toBe(1);
  });

  it('should return 0 for non-matching strings', async () => {
    const result = await scorer({
      expected: 'world',
      input: '',
      output: 'hello',
    });
    expect(result.score).toBe(0);
  });

  it('should compare numbers as strings', async () => {
    const result = await scorer({ expected: 42, input: '', output: 42 });
    expect(result.score).toBe(1);
  });

  it('should return 0 for different numbers', async () => {
    const result = await scorer({ expected: 43, input: '', output: 42 });
    expect(result.score).toBe(0);
  });

  it('should handle null and undefined', async () => {
    const result = await scorer({
      expected: null,
      input: '',
      output: null,
    });
    expect(result.score).toBe(1);
  });

  it('should return 0 for null vs undefined', async () => {
    const result = await scorer({
      expected: undefined,
      input: '',
      output: null,
    });
    expect(result.score).toBe(0);
  });

  it('should compare identical objects via JSON.stringify', async () => {
    const result = await scorer({
      expected: { a: 1 },
      input: '',
      output: { a: 1 },
    });
    expect(result.score).toBe(1);
  });

  it('should return 0 for different objects', async () => {
    const result = await scorer({
      expected: { a: 2 },
      input: '',
      output: { a: 1 },
    });
    expect(result.score).toBe(0);
  });

  it('should have the correct name', () => {
    expect(scorer.name).toBe('ExactMatch');
  });

  describe('with caseSensitive option', () => {
    it('should support case-insensitive matching', async () => {
      const caseInsensitive = exactMatch({ caseSensitive: false });
      const result = await caseInsensitive({
        expected: 'hello',
        input: '',
        output: 'Hello',
      });
      expect(result.score).toBe(1);
    });

    it('should be case-sensitive by default', async () => {
      const result = await scorer({
        expected: 'hello',
        input: '',
        output: 'Hello',
      });
      expect(result.score).toBe(0);
    });
  });

  describe('with trim option', () => {
    it('should support trim', async () => {
      const trimmed = exactMatch({ trim: true });
      const result = await trimmed({
        expected: 'hello',
        input: '',
        output: '  hello  ',
      });
      expect(result.score).toBe(1);
    });

    it('should not trim by default', async () => {
      const result = await scorer({
        expected: 'hello',
        input: '',
        output: '  hello  ',
      });
      expect(result.score).toBe(0);
    });
  });

  describe('with combined options', () => {
    it('should support both options together', async () => {
      const loose = exactMatch({ caseSensitive: false, trim: true });
      const result = await loose({
        expected: 'hello world',
        input: '',
        output: '  Hello World  ',
      });
      expect(result.score).toBe(1);
    });

    it('should preserve the scorer name', async () => {
      const configured = exactMatch({ caseSensitive: false });
      const result = await configured({
        expected: 'hello',
        input: '',
        output: 'hello',
      });
      expect(result.name).toBe('ExactMatch');
    });

    it('should handle partial options (only caseSensitive)', async () => {
      const configured = exactMatch({ caseSensitive: false });
      // Trim should still default to false
      const result = await configured({
        expected: 'hello',
        input: '',
        output: '  Hello  ',
      });
      expect(result.score).toBe(0); // Not trimmed, spaces cause mismatch
    });

    it('should handle partial options (only trim)', async () => {
      const configured = exactMatch({ trim: true });
      // CaseSensitive should still default to true
      const result = await configured({
        expected: 'Hello',
        input: '',
        output: '  Hello  ',
      });
      expect(result.score).toBe(1);
    });
  });
});
