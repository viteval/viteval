import { describe, expect, it } from 'vitest';
import { createProjectRuntime, runWithProjectRuntime } from '#/config/runtime';
import { createScorer } from './custom';

describe('createScorer', () => {
  it('should preserve a dependency factory scorer name in metadata and scores', async () => {
    const scorer = createScorer(({ json }) => ({
      name: 'context-scorer',
      score: () => ({ score: typeof json.dataset === 'function' ? 1 : 0 }),
    }));
    expect(scorer.name).toBe('context-scorer');
    expect(await scorer({ output: 'answer' })).toMatchObject({
      name: 'context-scorer',
      score: 1,
    });
  });

  it('should resolve dependency factories lazily and only once', async () => {
    let resolutions = 0;
    const scorer = createScorer(() => {
      resolutions++;
      return {
        name: 'lazy-scorer',
        score: () => ({ score: 1 }),
      };
    });
    expect(resolutions).toBe(0);
    expect(scorer.name).toBe('lazy-scorer');
    expect(scorer.name).toBe('lazy-scorer');
    const first = await scorer({ output: 'answer' });
    const second = await scorer({ output: 'answer' });
    expect(resolutions).toBe(1);
    expect(first.name).toBe(second.name);
    expect(first.name).toBe(scorer.name);
  });

  it('should re-resolve dependency factories when the active runtime changes', async () => {
    const contexts: unknown[] = [];
    const scorer = createScorer((context) => {
      contexts.push(context);
      return {
        name: 'runtime-scorer',
        score: () => ({ score: contexts.length }),
      };
    });
    expect(scorer.name).toBe('runtime-scorer');
    expect(contexts).toHaveLength(1);
    const fallback = contexts[0];

    await runWithProjectRuntime({
      runtime: createProjectRuntime({}),
      run: async () => {
        expect(scorer.name).toBe('runtime-scorer');
        expect(contexts).toHaveLength(2);
        expect(contexts[1]).not.toBe(fallback);
        await scorer({ output: 'answer' });
        expect(contexts).toHaveLength(2);
      },
    });
    await runWithProjectRuntime({
      runtime: createProjectRuntime({}),
      run: async () => {
        await scorer({ output: 'answer' });
        expect(contexts).toHaveLength(3);
        expect(contexts[2]).not.toBe(contexts[1]);
      },
    });
    expect(scorer.name).toBe('runtime-scorer');
    expect(contexts).toHaveLength(3);
  });

  it('should create a basic scorer with synchronous score function', async () => {
    const scorer = createScorer({
      name: 'exact-match',
      score: ({ output, expected }) => ({
        score: output === expected ? 1 : 0,
      }),
    });

    const result = await scorer({
      expected: 'hello',
      input: 'test',
      output: 'hello',
    });

    expect(result).toEqual({
      metadata: undefined,
      name: 'exact-match',
      score: 1,
    });
  });

  it('should create a scorer with a name', () => {
    const scorer = createScorer({
      name: 'test-scorer',
      score: () => ({ score: 1 }),
    });
    expect(scorer.name).toBe('test-scorer');
  });

  it('should create scorer with asynchronous score function', async () => {
    const scorer = createScorer({
      name: 'async-scorer',
      score: async ({ output }) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          // @ts-expect-error - output is of type unknown
          score: output.length > 5 ? 1 : 0,
        };
      },
    });

    const result = await scorer({
      input: 'test',
      output: 'hello world',
    });

    expect(result).toEqual({
      metadata: undefined,
      name: 'async-scorer',
      score: 1,
    });
  });

  it('should handle scorer with metadata', async () => {
    const scorer = createScorer({
      name: 'metadata-scorer',
      score: ({ output, expected }) => ({
        metadata: {
          // @ts-expect-error - output is of type unknown
          comparison: output === expected,
          outputLength: output.length,
          timestamp: Date.now(),
        },
        score: output === expected ? 1 : 0,
      }),
    });

    const result = await scorer({
      expected: 'world',
      input: 'test',
      output: 'hello',
    });

    expect(result.name).toBe('metadata-scorer');
    expect(result.score).toBe(0);
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
        metadata: {
          customParam,
          outputLength: output.length,
          threshold,
        },
        score:
          output.includes(customParam) && output.length > threshold ? 1 : 0,
      }),
    });

    const result = await scorer({
      // @ts-expect-error - input is of type unknown
      customParam: 'test',
      input: 'test input',
      output: 'hello world test',
      threshold: 10,
    });

    expect(result.name).toBe('extra-args-scorer');
    expect(result.score).toBe(1);
    expect(result.metadata?.customParam).toBe('test');
    expect(result.metadata?.threshold).toBe(10);
  });

  it('should handle scorer that returns null score', async () => {
    const scorer = createScorer({
      name: 'null-scorer',
      score: () => ({
        metadata: { reason: 'unable to score' },
        score: null,
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
          return { metadata: { error: 'No expected value' }, score: null };
        }

        // @ts-expect-error - expected is of type unknown
        const similarity = calculateSimilarity(output, expected);
        const passed = similarity > 0.8;

        return {
          metadata: {
            similarity,
            passed,
            // @ts-expect-error - output is of type unknown
            outputWords: output.split(' ').length,
            // @ts-expect-error - expected is of type unknown
            expectedWords: expected.split(' ').length,
          },
          score: passed ? similarity : 0,
        };
      },
    });

    const result = await scorer({
      expected: 'the quick brown dog',
      input: 'test',
      output: 'the quick brown fox',
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
