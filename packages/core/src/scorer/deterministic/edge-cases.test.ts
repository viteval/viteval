import { describe, expect, it } from 'vitest';
import { scorers } from '../prebuilt';

describe('deterministic scorer edge cases', () => {
  it.each([
    { output: true, expected: true, score: 1 },
    { output: true, expected: false, score: 0 },
    { output: true, expected: 1, score: 0 },
    { output: 1, expected: true, score: 0 },
    { output: [], expected: [], score: 1 },
    { output: {}, expected: {}, score: 1 },
    { output: [], expected: {}, score: 0 },
  ])(
    'should compare JSON $output with $expected',
    async ({ output, expected, score }) => {
      expect((await scorers.jsonDiff()({ output, expected })).score).toBe(
        score
      );
    }
  );

  it('should parse JSON arrays before list matching', async () => {
    expect(
      (
        await scorers.listContains()({
          output: '["a", "b"]',
          expected: ['b', 'a'],
        })
      ).score
    ).toBe(1);
  });

  it('should coerce scalar list values', async () => {
    expect(
      (await scorers.listContains()({ output: 42, expected: [42] })).score
    ).toBe(1);
  });

  it('should penalize output items assigned to padded columns', async () => {
    expect(
      (
        await scorers.listContains()({
          output: ['a', 'b', 'c'],
          expected: ['a'],
        })
      ).score
    ).toBeCloseTo(1 / 3);
  });
});
