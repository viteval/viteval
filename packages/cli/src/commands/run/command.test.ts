import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVitest, TestsNotFoundError, type Vitest } from 'vitest/node';
import { mockLog, runHandler, type HandlerResult } from 'maltty/test';
import { runCommand, runEvaluations } from './command';

// The native runner boundary is simulated; Vitest wiring and signal cleanup are real.
vi.mock('vitest/node', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vitest/node')>()),
  createVitest: vi.fn(),
}));

interface NativeRunner {
  start: ReturnType<typeof vi.fn>;
  collect: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  cancelCurrentRun: ReturnType<typeof vi.fn>;
}

interface Invocation extends HandlerResult<Record<string, unknown>> {
  stdout: () => string;
}

let root: string, nativeSignals: number;
const directories: string[] = [],
  originalExitCode = process.exitCode;

beforeEach(async () => {
  vi.mocked(createVitest).mockReset();
  root = await mkdtemp(path.join(tmpdir(), 'viteval-run-unit-'));
  directories.push(root);
  nativeSignals =
    process.listenerCount('SIGINT') + process.listenerCount('SIGTERM');
});

afterEach(async () => {
  vi.restoreAllMocks();
  process.exitCode = originalExitCode;
  expect(
    process.listenerCount('SIGINT') + process.listenerCount('SIGTERM')
  ).toBe(nativeSignals);
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('runEvaluations', () => {
  it('should translate evaluation flags into internal Vitest options and pass file filters', async () => {
    await writeFile(
      path.join(root, 'package.json'),
      '{"name":"runner-translation","type":"module"}'
    );
    const native = nativeRunner(),
      invocation = await invokeRun(
        {
          root,
          timeout: 5000,
          concurrency: 2,
          retries: 1,
          name: 'accuracy',
          coverage: true,
        },
        ['viteval', 'run', '--root', root, 'a.eval.ts', 'b.eval.ts']
      );
    expect(invocation.error).toBeUndefined();
    expect(native.start).toHaveBeenCalledWith(['a.eval.ts', 'b.eval.ts']);
    expect(vi.mocked(createVitest).mock.calls[0][0]).toEqual({
      config: false,
      root,
      run: true,
      watch: false,
      testTimeout: 5000,
      maxConcurrency: 2,
      retry: 1,
      testNamePattern: 'accuracy',
      coverage: { enabled: true },
    });
    expect(vi.mocked(createVitest).mock.calls[0][1]?.plugins).not.toHaveLength(
      0
    );
    expect(native.close).toHaveBeenCalledOnce();
    expect(process.exitCode).toBe(originalExitCode);
  });

  it('should omit unspecified translations', async () => {
    const native = nativeRunner();
    await runEvaluations({ argv: {}, log: mockLog() });
    expect(vi.mocked(createVitest).mock.calls[0][0]).toEqual({
      config: false,
      root: undefined,
      run: true,
      watch: false,
    });
    expect(native.close).toHaveBeenCalledOnce();
  });

  it('should honor explicit config files with their resolved projects', async () => {
    const config = path.join(root, 'viteval.config.ts');
    await writeFile(config, 'export default { __viteval: true };');
    const native = nativeRunner();
    const invocation = await invokeRun({ config: 'viteval.config.ts', root });
    expect(invocation.error).toBeUndefined();
    expect(vi.mocked(createVitest).mock.calls[0][0]?.config).toBe(config);
    expect(vi.mocked(createVitest).mock.calls[0][0]?.root).toBe(root);
    expect(native.start).toHaveBeenCalledWith([]);
    expect(native.close).toHaveBeenCalledOnce();
  });

  it('should report missing evaluation files without losing the exit status', async () => {
    const native = nativeRunner();
    native.start.mockRejectedValueOnce(new TestsNotFoundError());
    const invocation = await invokeRun({}, ['viteval', 'run', 'a.eval.ts']);
    expect(invocation.stdout()).toContain(
      'No evaluation files found matching a.eval.ts'
    );
    expect(process.exitCode).toBe(1);
    expect(native.close).toHaveBeenCalledOnce();
  });

  it('should preserve unexpected runner diagnostics', async () => {
    const native = nativeRunner();
    native.start.mockRejectedValueOnce(new Error('worker exploded'));
    const invocation = await invokeRun({});
    expect(invocation.error?.message).toBe('worker exploded');
    expect(native.close).toHaveBeenCalledOnce();
  });

  it('should keep watch mode alive and terminate cleanly on signals', async () => {
    const native = nativeRunner(),
      invocation = await invokeRun({ watch: true });
    expect(invocation.stdout()).toContain('Watching evaluation files');
    expect(native.close).not.toHaveBeenCalled();
    process.emit('SIGINT', 'SIGINT');
    await vi.waitFor(() => expect(native.close).toHaveBeenCalledOnce());
    expect(native.cancelCurrentRun).toHaveBeenCalledWith('keyboard-input');
    expect(process.exitCode).toBe(130);
  });

  it('should close interrupted startup once even when repeated signals or cleanup fail', async () => {
    const native = nativeRunner();
    let finish: () => void = () => {};
    native.start.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    native.cancelCurrentRun.mockRejectedValue(new Error('cancel failed'));
    native.close.mockRejectedValue(new Error('close failed'));
    const pending = invokeRun({ watch: true });
    await vi.waitFor(() => expect(native.start).toHaveBeenCalled());
    process.emit('SIGTERM', 'SIGTERM');
    process.emit('SIGTERM', 'SIGTERM');
    await vi.waitFor(() => expect(native.close).toHaveBeenCalledOnce());
    finish();
    const result = await pending;
    expect(native.cancelCurrentRun).toHaveBeenCalledOnce();
    expect(result.stdout()).toContain('cancel failed');
    expect(result.stdout()).toContain('close failed');
    expect(result.stdout()).not.toContain('Watching evaluation files');
    expect(process.exitCode).toBe(143);
  });

  it('should close watch mode start failures without registering signals', async () => {
    const native = nativeRunner();
    native.start.mockRejectedValueOnce(new TestsNotFoundError());
    const invocation = await invokeRun({ watch: true });
    expect(invocation.stdout()).toContain('No evaluation files found');
    expect(invocation.stdout()).not.toContain('Watching evaluation files');
    expect(native.close).toHaveBeenCalledOnce();
    expect(process.exitCode).toBe(1);
  });
});

function nativeRunner(): NativeRunner {
  const native = {
    start: vi.fn(async () => ({ testModules: [], unhandledErrors: [] })),
    collect: vi.fn(async () => ({ testModules: [], unhandledErrors: [] })),
    close: vi.fn(async () => {}),
    cancelCurrentRun: vi.fn(async () => {}),
  };
  vi.mocked(createVitest).mockImplementation(async () => native as Vitest);
  return native;
}

async function invokeRun(
  args: Record<string, unknown>,
  tokens: readonly string[] = ['viteval', 'run']
): Promise<Invocation> {
  const log = mockLog(),
    [command = 'run', ...commandArgs] = tokens.slice(1),
    result = await runHandler({
      cmd: runCommand,
      overrides: { args, log, meta: { command: [command, ...commandArgs] } },
    });
  return {
    ...result,
    stdout: () =>
      [log.error, log.info]
        .flatMap((method) => vi.mocked(method).mock.calls.flat())
        .join('\n'),
  };
}
