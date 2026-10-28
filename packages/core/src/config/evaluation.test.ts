import { describe, expect, it, vi } from 'vitest';
import type { TestContext } from 'vitest';

interface CaseContext {
  task: TestContext['task'];
  annotate: (message: string) => Promise<void>;
  onTestFinished: (run: () => Promise<void>) => void;
}

type CaseRunner = (
  data: { dataItem: { input: string; expected: string }; testName: string },
  context: CaseContext
) => Promise<void>;

describe('registerEvaluation cancellation adapter', () => {
  it('should retain a fallback diagnostic when the engine finishes a pending case without errors', async () => {
    const registerCase =
      vi.fn<(name: string, options: unknown, run: CaseRunner) => void>();
    const collect = vi.fn<
      (
        name: string,
        options: unknown,
        run: () => Promise<void>
      ) => Promise<void>
    >(async (_name, _options, run) => run());
    const recordArtifact = vi.fn().mockResolvedValue(undefined);
    const finished = vi.fn<(run: () => Promise<void>) => void>();
    const pending = Promise.withResolvers<string>();
    const task = vi.fn(() => pending.promise);
    vi.doMock('vitest', async (importOriginal) => ({
      ...(await importOriginal<typeof import('vitest')>()),
      aroundAll: vi.fn(),
      describe: Object.assign(collect, { skip: vi.fn() }),
      recordArtifact,
      test: Object.assign(vi.fn(), { for: () => registerCase }),
    }));
    try {
      const { registerEvaluation } = await import('./evaluation');
      const dataItem = { input: 'pending', expected: 'pending' };
      registerEvaluation({
        name: 'cancelled',
        options: {
          data: [dataItem],
          results: [],
          task,
          scorers: [() => ({ name: 'unused', score: 1 })],
        },
      });
      await collect.mock.results[0].value;
      const run = registerCase.mock.calls[0][2];
      const currentTask = { id: 'cancelled-case' } as TestContext['task'];
      const running = run(
        { dataItem, testName: 'pending' },
        {
          task: currentTask,
          annotate: vi.fn(),
          onTestFinished: finished,
        }
      );
      await vi.waitFor(() => expect(task).toHaveBeenCalledOnce());
      await finished.mock.calls[0][0]();
      pending.resolve('late');
      await running;
      expect(recordArtifact).toHaveBeenCalledExactlyOnceWith(currentTask, {
        type: 'viteval:eval-result',
        result: expect.objectContaining({
          output: null,
          metadata: { executionError: 'Evaluation did not complete' },
        }),
      });
    } finally {
      pending.resolve('cleanup');
      vi.doUnmock('vitest');
    }
  });
});
