import { describe, expect, it, vi } from 'vitest';
import {
  createFailureResult,
  createUnscoredResult,
  evaluationScore,
  runEvaluationCase,
  validateEvaluationOptions,
} from './case';

const DATA = [{ input: 'hello', expected: 'hello', context: 'reference' }];
type CaseParams = Parameters<typeof runEvaluationCase<typeof DATA, string>>[0];

describe('runEvaluationCase', () => {
  it('should score with explicit functions and preserve extra case fields', async () => {
    const task = vi.fn(({ input }) => input);
    const scorer = vi.fn(() => ({ name: 'equal', score: 1 }));
    const result = await runCase({ task, scorers: [scorer] });
    expect(task).toHaveBeenCalledExactlyOnceWith({
      input: 'hello',
      context: 'reference',
    });
    expect(scorer).toHaveBeenCalledExactlyOnceWith({
      input: 'hello',
      context: 'reference',
      expected: 'hello',
      output: 'hello',
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        name: 'case',
        mean: 1,
        median: 1,
        sum: 1,
        metadata: { context: 'reference' },
      },
    });
  });

  it('should discard task results arriving after cancellation', async () => {
    const cancellation = new AbortController();
    const scorer = vi.fn(() => ({ name: 'unused', score: 1 }));
    const result = await runCase({
      signal: cancellation.signal,
      task: async () => {
        cancellation.abort();
        return 'late';
      },
      scorers: [scorer],
    });
    expect(result).toMatchObject({ ok: true, value: undefined });
    expect(scorer).not.toHaveBeenCalled();
  });

  it('should discard scores arriving after cancellation', async () => {
    const cancellation = new AbortController();
    const result = await runCase({
      signal: cancellation.signal,
      scorers: [
        async () => {
          cancellation.abort();
          return { name: 'late', score: 1 };
        },
      ],
    });
    expect(result).toMatchObject({ ok: true, value: undefined });
  });

  it('should not start a cancelled case', async () => {
    const task = vi.fn(() => 'unused');
    const result = await runCase({ task, signal: AbortSignal.abort() });
    expect(result).toMatchObject({ ok: true, value: undefined });
    expect(task).not.toHaveBeenCalled();
  });

  it('should return task and scorer failures as values', async () => {
    const failure = new Error('task failed');
    expect(
      await runCase({
        task: () => {
          throw failure;
        },
      })
    ).toMatchObject({ ok: false, error: failure });
    expect(
      await runCase({
        scorers: [
          () => {
            throw failure;
          },
        ],
      })
    ).toMatchObject({ ok: false, error: failure });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])(
    'should reject non-finite scores: %s',
    async (score) => {
      expect(
        await runCase({ scorers: [() => ({ name: 'invalid', score })] })
      ).toMatchObject({
        ok: false,
        error: { message: 'Scorer invalid returned a non-finite score' },
      });
    }
  );

  it('should normalize null scores and use the scorer function name when unnamed', async () => {
    function nullable() {
      return { name: '', score: null };
    }
    expect(await runCase({ scorers: [nullable] })).toMatchObject({
      ok: true,
      value: { scores: [{ name: 'nullable', score: 0 }] },
    });
  });

  it('should reject scorer metadata that cannot be persisted as JSON', async () => {
    const result = await runCase({
      scorers: [
        () => ({ name: 'invalid metadata', score: 1, metadata: { value: 1n } }),
      ],
    });
    expect(result).toMatchObject({ ok: false, error: expect.any(Error) });
  });
});

describe('evaluation result projection', () => {
  it('should replace non-serializable inputs with null while retaining failure diagnostics', () => {
    const result = createFailureResult({
      dataItem: { input: 1n, expected: 2n },
      name: 'unserializable',
      aggregation: 'mean',
      threshold: 1,
      error: new Error('invalid input'),
    });
    expect(result).toMatchObject({
      input: null,
      expected: null,
      output: null,
      metadata: { executionError: 'invalid input' },
    });
  });
  it('should preserve neutral unexecuted cases without diagnostics', () => {
    const result = createUnscoredResult({
      dataItem: DATA[0],
      name: 'skipped',
      aggregation: 'mean',
      threshold: 1,
    });
    expect(result).not.toHaveProperty('metadata');
    expect(result).toMatchObject({
      input: 'hello',
      expected: 'hello',
      output: null,
      scores: [],
    });
  });

  it.each([new Error('failed'), 'failed'])(
    'should retain failure diagnostics: %s',
    (error) => {
      expect(
        createFailureResult({
          dataItem: DATA[0],
          name: 'failed',
          aggregation: 'mean',
          threshold: 1,
          error,
        })
      ).toMatchObject({ metadata: { executionError: 'failed' } });
    }
  );

  it.each(['mean', 'median', 'sum'] as const)(
    'should select %s without engine state',
    (aggregation) => {
      const result = {
        ...createUnscoredResult({
          dataItem: DATA[0],
          name: 'case',
          aggregation,
          threshold: 1,
        }),
        mean: 0.2,
        median: 0.4,
        sum: 0.6,
      };
      expect(evaluationScore(result)).toBe(result[aggregation]);
    }
  );
});

describe('validateEvaluationOptions', () => {
  it.each([
    { threshold: Number.NaN },
    { concurrency: 0 },
    { scorerCount: 0 },
    { timeout: 0 },
    { retries: -1 },
  ])('should reject invalid options: %j', (options) => {
    expect(
      validateEvaluationOptions({
        threshold: 1,
        concurrency: 5,
        scorerCount: 1,
        ...options,
      }).ok
    ).toBe(false);
  });

  it('should accept inherited or explicitly valid limits', () => {
    expect(
      validateEvaluationOptions({
        threshold: 1,
        concurrency: 5,
        scorerCount: 1,
      }).ok
    ).toBe(true);
    expect(
      validateEvaluationOptions({
        threshold: 1,
        concurrency: 5,
        scorerCount: 1,
        timeout: 100,
        retries: 0,
      }).ok
    ).toBe(true);
  });
});

function runCase(options: Partial<CaseParams> = {}) {
  return runEvaluationCase<typeof DATA, string>({
    dataItem: DATA[0],
    name: 'case',
    task: ({ input }) => input,
    scorers: [() => ({ name: 'equal', score: 1 })],
    aggregation: 'mean',
    threshold: 1,
    signal: new AbortController().signal,
    ...options,
  });
}
