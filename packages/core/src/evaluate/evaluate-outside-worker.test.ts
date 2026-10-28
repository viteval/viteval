import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('evaluate outside a worker', () => {
  it('should reject evaluation registration outside the native runner', async () => {
    vi.stubEnv('VITEST_WORKER_ID', '');
    vi.resetModules();
    const { evaluate } = await import('./evaluate');
    expect(() =>
      evaluate('outside worker', {
        data: [{ input: 'q', expected: 'a' }],
        task: () => 'a',
        scorers: [() => ({ name: 'unused', score: 1 })],
      })
    ).toThrow(
      'evaluate() must run in an evaluation module through viteval run'
    );
  });
});
