import { describe, expect, it } from 'vitest';
import { exactMatch } from './exact-match';

describe('exactMatch', () => {
  it('should return 1 for matching strings', async () => {
    const result = await exactMatch({ input: '', output: 'hello', expected: 'hello' });
    expect(result.score).toBe(1);
  });

  it('should return 0 for non-matching strings', async () => {
    const result = await exactMatch({ input: '', output: 'hello', expected: 'world' });
    expect(result.score).toBe(0);
  });

  it('should compare numbers as strings', async () => {
    const result = await exactMatch({ input: '', output: 42, expected: 42 });
    expect(result.score).toBe(1);
  });

  it('should return 0 for different numbers', async () => {
    const result = await exactMatch({ input: '', output: 42, expected: 43 });
    expect(result.score).toBe(0);
  });

  it('should handle null and undefined', async () => {
    const result = await exactMatch({ input: '', output: null, expected: null });
    expect(result.score).toBe(1);
  });

  it('should return 0 for null vs undefined', async () => {
    const result = await exactMatch({ input: '', output: null, expected: undefined });
    expect(result.score).toBe(0);
  });

  it('should compare identical objects via JSON.stringify', async () => {
    const result = await exactMatch({
      input: '',
      output: { a: 1 },
      expected: { a: 1 },
    });
    expect(result.score).toBe(1);
  });

  it('should return 0 for different objects', async () => {
    const result = await exactMatch({
      input: '',
      output: { a: 1 },
      expected: { a: 2 },
    });
    expect(result.score).toBe(0);
  });

  it('should have the correct name', () => {
    expect(exactMatch.name).toBe('ExactMatch');
  });
});
