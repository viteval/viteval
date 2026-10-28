import childProcess, { type ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { syncBuiltinESMExports } from 'node:module';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockLog, runHandler } from 'maltty/test';
import open from 'open';
import { uiCommand } from './ui';

vi.mock('open', () => ({ default: vi.fn(async () => {}) }));

const originalExitCode = process.exitCode;
beforeEach(() => {
  vi.mocked(open).mockReset().mockResolvedValue(undefined);
  vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  syncBuiltinESMExports();
  process.exitCode = originalExitCode;
});

describe('uiCommand', () => {
  it.each([
    { debug: false, env: 'false', browser: false, signal: 'SIGTERM' as const },
    { debug: true, env: 'false', browser: true, signal: 'SIGINT' as const },
    { debug: false, env: 'true', browser: false, signal: 'SIGTERM' as const },
  ])(
    'should start a real launcher and gracefully handle $signal',
    async ({ debug, env, browser, signal }) => {
      const child = nativeChild(),
        log = mockLog(),
        interruptCount = process.listenerCount('SIGINT'),
        terminateCount = process.listenerCount('SIGTERM');
      vi.stubEnv('VITEVAL_DEBUG_MODE', env);
      vi.spyOn(childProcess, 'fork').mockImplementation(() => {
        queueMicrotask(() => {
          child.emit('message', { type: 'ready' });
          setTimeout(() => process.emit(signal), 5);
        });
        return child;
      });
      syncBuiltinESMExports();
      const result = await runHandler({
        cmd: uiCommand,
        overrides: { args: { debug, open: browser }, log },
      });
      expect(result.error).toBeUndefined();
      expect(log.success).toHaveBeenCalledWith(
        expect.stringContaining('View the results at http://localhost:')
      );
      expect(log.info).toHaveBeenCalledWith('Shutting down...');
      expect(process.exit).toHaveBeenCalledWith(0);
      expect(child.kill).toHaveBeenCalledOnce();
      expect(open).toHaveBeenCalledTimes(browser ? 1 : 0);
      expect(process.listenerCount('SIGINT')).toBe(interruptCount);
      expect(process.listenerCount('SIGTERM')).toBe(terminateCount);
    }
  );

  it('should close the launcher and report startup errors', async () => {
    const child = nativeChild(),
      log = mockLog();
    vi.spyOn(childProcess, 'fork').mockImplementation(() => {
      queueMicrotask(() => child.emit('error', new Error('cannot start UI')));
      return child;
    });
    syncBuiltinESMExports();
    const result = await runHandler({ cmd: uiCommand, overrides: { log } });
    expect(result.error).toBeUndefined();
    expect(log.error).toHaveBeenCalledWith('Failed to start: cannot start UI');
    expect(child.kill).toHaveBeenCalledOnce();
    expect(process.exitCode).toBe(1);
  });

  it('should report non-Error browser failures and shut down the server', async () => {
    const child = nativeChild(),
      log = mockLog();
    vi.mocked(open).mockRejectedValue('browser unavailable');
    vi.spyOn(childProcess, 'fork').mockImplementation(() => {
      queueMicrotask(() => child.emit('message', { type: 'ready' }));
      return child;
    });
    syncBuiltinESMExports();
    await runHandler({
      cmd: uiCommand,
      overrides: { args: { open: true }, log },
    });
    expect(log.error).toHaveBeenCalledWith(
      'Failed to start: browser unavailable'
    );
    expect(child.kill).toHaveBeenCalledOnce();
    expect(process.exitCode).toBe(1);
  });
});

function nativeChild() {
  const child = Object.assign(new EventEmitter(), {
    pid: 123,
    exitCode: null,
    signalCode: null,
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    kill: vi.fn(() => {
      queueMicrotask(() => child.emit('exit', 0, null));
      return true;
    }),
  });
  return child as unknown as ChildProcess;
}
