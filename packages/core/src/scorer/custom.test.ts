import { describe, expect, it } from 'vitest';
import { createScorer } from './custom';

describe('createScorer', () => {
  it('should create a basic scorer with synchronous score function', async () => {
    const scorer = createScorer({
      name: 'exact-match',
      score: ({ output, expected }) => ({
        score: output === expected ? 1.0 : 0.0,
      }),
    });

    const result = await scorer({
      input: 'test',
      output: 'hello',
      expected: 'hello',
    });

    expect(result).toEqual({
      name: 'exact-match',
      score: 1.0,
      metadata: undefined,
    });
  });

  it('should create scorer with asynchronous score function', async () => {
    const scorer = createScorer({
      name: 'async-scorer',
      score: async ({ output }) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          // @ts-expect-error - output is of type unknown
          score: output.length > 5 ? 1.0 : 0.0,
        };
      },
    });

    const result = await scorer({
      input: 'test',
      output: 'hello world',
    });

    expect(result).toEqual({
      name: 'async-scorer',
      score: 1.0,
      metadata: undefined,
    });
  });

  it('should handle scorer with metadata', async () => {
    const scorer = createScorer({
      name: 'metadata-scorer',
      score: ({ output, expected }) => ({
        score: output === expected ? 1.0 : 0.0,
        metadata: {
          // @ts-expect-error - output is of type unknown
          outputLength: output.length,
          comparison: output === expected,
          timestamp: Date.now(),
        },
      }),
    });

    const result = await scorer({
      input: 'test',
      output: 'hello',
      expected: 'world',
    });

    expect(result.name).toBe('metadata-scorer');
    expect(result.score).toBe(0.0);
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.outputLength).toBe(5);
    expect(result.metadata?.comparison).toBe(false);
    expect(typeof result.metadata?.timestamp).toBe('number');
  });

  it('should handle scorer with extra arguments', async () => {
    interface ExtraArgs {
      customParam: string;
      threshold: number;
    }

    // @ts-expect-error - output is of type unknown
    const scorer = createScorer<string, ExtraArgs>({
      name: 'extra-args-scorer',
      score: ({ output, customParam, threshold }) => ({
        score:
          output.includes(customParam) && output.length > threshold ? 1.0 : 0.0,
        metadata: {
          customParam,
          threshold,
          outputLength: output.length,
        },
      }),
    });

    const result = await scorer({
      // @ts-expect-error - input is of type unknown
      input: 'test input',
      output: 'hello world test',
      customParam: 'test',
      threshold: 10,
    });

    expect(result.name).toBe('extra-args-scorer');
    expect(result.score).toBe(1.0);
    expect(result.metadata?.customParam).toBe('test');
    expect(result.metadata?.threshold).toBe(10);
  });

  it('should handle scorer that returns null score', async () => {
    const scorer = createScorer({
      name: 'null-scorer',
      score: () => ({
        score: null,
        metadata: { reason: 'unable to score' },
      }),
    });

    const result = await scorer({
      input: 'test',
      output: 'anything',
    });

    expect(result.name).toBe('null-scorer');
    expect(result.score).toBeNull();
    expect(result.metadata?.reason).toBe('unable to score');
  });

  it('should handle scorer with complex scoring logic', async () => {
    const scorer = createScorer({
      name: 'complex-scorer',
      score: ({ output, expected }) => {
        if (!expected) {
          return { score: null, metadata: { error: 'No expected value' } };
        }

        // @ts-expect-error - expected is of type unknown
        const similarity = calculateSimilarity(output, expected);
        const passed = similarity > 0.8;

        return {
          score: passed ? similarity : 0.0,
          metadata: {
            similarity,
            passed,
            // @ts-expect-error - output is of type unknown
            outputWords: output.split(' ').length,
            // @ts-expect-error - expected is of type unknown
            expectedWords: expected.split(' ').length,
          },
        };
      },
    });

    const result = await scorer({
      input: 'test',
      output: 'the quick brown fox',
      expected: 'the quick brown dog',
    });

    expect(result.name).toBe('complex-scorer');
    expect(typeof result.score).toBe('number');
    expect(result.metadata?.similarity).toBeDefined();
    expect(result.metadata?.passed).toBeDefined();
  });
});

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  const intersection = words1.filter((word) => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  return intersection.length / union.length;
}
