import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EvalProvider } from '#/provider/types';
import type { EvalResult } from '#/types';
import { createRun } from './create-run';
import type { RunConfig } from './types';

function createMockEvalResult(
  overrides: Partial<EvalResult> = {}
): EvalResult {
  return {
    aggregation: 'mean',
    expected: 'expected',
    input: 'test input',
    mean: 0.85,
    median: 0.9,
    name: 'test-eval',
    output: 'actual output',
    scores: [{ name: 'accuracy', score: 0.85 }],
    sum: 0.85,
    threshold: 0.7,
    ...overrides,
  };
}

function createMockProvider(): EvalProvider {
  return {
    addResult: vi.fn().mockResolvedValue({ ok: true, result: {}, status: 'ok' }),
    addResults: vi.fn().mockResolvedValue({ ok: true, result: [], status: 'ok' }),
    complete: vi.fn().mockResolvedValue({
      ok: true,
      result: { id: 'stored-run-id' },
      status: 'ok',
    }),
    create: vi.fn().mockResolvedValue({
      ok: true,
      result: { id: 'stored-run-id', name: 'test-run' },
      status: 'ok',
    }),
    get: vi.fn().mockResolvedValue({ ok: true, result: undefined, status: 'ok' }),
    list: vi.fn().mockResolvedValue({ ok: true, result: [], status: 'ok' }),
  };
}

const DEFAULT_CONFIG: RunConfig = {
  aggregation: 'mean',
  scorerNames: ['accuracy'],
  threshold: 0.7,
};

describe('createRun', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('identity', () => {
    it('should generate a cuid2 id', () => {
      const run = createRun();
      expect(run.id).toMatch(/^[a-z0-9]+$/);
      expect(run.id.length).toBeGreaterThan(10);
    });

    it('should generate a kebab-case name', () => {
      const run = createRun();
      expect(run.name).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/);
    });

    it('should accept a custom name', () => {
      const run = createRun({ name: 'my-custom-run' });
      expect(run.name).toBe('my-custom-run');
    });

    it('should generate unique ids across calls', () => {
      const runs = Array.from({ length: 10 }, () => createRun());
      const ids = new Set(runs.map((r) => r.id));
      expect(ids.size).toBe(10);
    });
  });

  describe('state', () => {
    it('should start as pending', () => {
      const run = createRun();
      const s = run.state();
      expect(s.status).toBe('pending');
      expect(s.results).toEqual([]);
      expect(s.summary).toBeUndefined();
      expect(s.config).toBeUndefined();
    });

    it('should include createdAt as ISO string', () => {
      const run = createRun();
      const s = run.state();
      expect(new Date(s.createdAt).toISOString()).toBe(s.createdAt);
    });
  });

  describe('start', () => {
    it('should transition to running', async () => {
      const run = createRun();
      await run.start(DEFAULT_CONFIG);
      expect(run.state().status).toBe('running');
      expect(run.state().config).toEqual(DEFAULT_CONFIG);
    });

    it('should persist to provider when configured', async () => {
      const provider = createMockProvider();
      const run = createRun({ evalProvider: provider, tags: ['ci'] });
      await run.start(DEFAULT_CONFIG);

      expect(provider.create).toHaveBeenCalledWith(
        expect.objectContaining({
          config: DEFAULT_CONFIG,
          name: run.name,
          tags: ['ci'],
        })
      );
    });
  });

  describe('addResults', () => {
    it('should accumulate results', async () => {
      const run = createRun();
      await run.start(DEFAULT_CONFIG);

      const results = [createMockEvalResult(), createMockEvalResult()];
      await run.addResults(results);

      expect(run.state().results).toHaveLength(2);
    });

    it('should batch persist when provider supports addResults', async () => {
      const provider = createMockProvider();
      const run = createRun({ evalProvider: provider });
      await run.start(DEFAULT_CONFIG);

      await run.addResults([createMockEvalResult()]);

      expect(provider.addResults).toHaveBeenCalledOnce();
      expect(provider.addResult).not.toHaveBeenCalled();
    });

    it('should fall back to individual addResult when batch is unavailable', async () => {
      const provider = createMockProvider();
      provider.addResults = undefined;
      const run = createRun({ evalProvider: provider });
      await run.start(DEFAULT_CONFIG);

      await run.addResults([createMockEvalResult(), createMockEvalResult()]);

      expect(provider.addResult).toHaveBeenCalledTimes(2);
    });
  });

  describe('complete', () => {
    it('should transition to completed and compute summary', async () => {
      const run = createRun();
      await run.start(DEFAULT_CONFIG);
      await run.addResults([
        createMockEvalResult({ mean: 0.9 }),
        createMockEvalResult({ mean: 0.8 }),
      ]);

      const final = await run.complete();

      expect(final.status).toBe('completed');
      expect(final.summary).toBeDefined();
      expect(final.summary!.totalCount).toBe(2);
      expect(final.summary!.passedCount).toBe(2);
      expect(final.summary!.passed).toBe(true);
      expect(final.summary!.meanScore).toBeCloseTo(0.85);
    });

    it('should mark failed results correctly', async () => {
      const run = createRun();
      await run.start(DEFAULT_CONFIG);
      await run.addResults([
        createMockEvalResult({ mean: 0.9 }),
        createMockEvalResult({ mean: 0.3 }),
      ]);

      const final = await run.complete();

      expect(final.summary!.passedCount).toBe(1);
      expect(final.summary!.failedCount).toBe(1);
      expect(final.summary!.passed).toBe(false);
    });

    it('should accept a status override', async () => {
      const run = createRun();
      await run.start(DEFAULT_CONFIG);
      const final = await run.complete({ status: 'failed' });
      expect(final.status).toBe('failed');
    });

    it('should persist completion to provider', async () => {
      const provider = createMockProvider();
      const run = createRun({ evalProvider: provider });
      await run.start(DEFAULT_CONFIG);
      await run.addResults([createMockEvalResult()]);
      await run.complete();

      expect(provider.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'stored-run-id',
          status: 'completed',
          summary: expect.objectContaining({
            totalCount: 1,
          }),
        })
      );
    });

    it('should handle empty results gracefully', async () => {
      const run = createRun();
      await run.start(DEFAULT_CONFIG);
      const final = await run.complete();

      expect(final.summary!.totalCount).toBe(0);
      expect(final.summary!.passed).toBe(true);
    });
  });
});
