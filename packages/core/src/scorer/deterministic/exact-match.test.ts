import { describe, expect, it } from 'vitest';
import { exactMatch } from './exact-match';

describe('exactMatch', () => {
  it('should return 1 for matching strings', async () => {
    const result = await exactMatch({
      expected: 'hello',
      input: '',
      output: 'hello',
    });
    expect(result.score).toBe(1);
  });

  it('should return 0 for non-matching strings', async () => {
    const result = await exactMatch({
      expected: 'world',
      input: '',
      output: 'hello',
    });
    expect(result.score).toBe(0);
  });

  it('should compare numbers as strings', async () => {
    const result = await exactMatch({ expected: 42, input: '', output: 42 });
    expect(result.score).toBe(1);
  });

  it('should return 0 for different numbers', async () => {
    const result = await exactMatch({ expected: 43, input: '', output: 42 });
    expect(result.score).toBe(0);
  });

  it('should handle null and undefined', async () => {
    const result = await exactMatch({
      expected: null,
      input: '',
      output: null,
    });
    expect(result.score).toBe(1);
  });

  it('should return 0 for null vs undefined', async () => {
    const result = await exactMatch({
      expected: undefined,
      input: '',
      output: null,
    });
    expect(result.score).toBe(0);
  });

  it('should compare identical objects via JSON.stringify', async () => {
    const result = await exactMatch({
      expected: { a: 1 },
      input: '',
      output: { a: 1 },
    });
    expect(result.score).toBe(1);
  });

  it('should return 0 for different objects', async () => {
    const result = await exactMatch({
      expected: { a: 2 },
      input: '',
      output: { a: 1 },
    });
    expect(result.score).toBe(0);
  });

  it('should have the correct name', () => {
    expect(exactMatch.name).toBe('ExactMatch');
  });
});
