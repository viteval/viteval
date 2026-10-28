import type { ChildProcess } from 'node:child_process';
import { fork } from 'node:child_process';
import { EventEmitter } from 'node:events';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVitevalServer } from '../../server.js';

vi.mock('node:child_process', () => ({ fork: vi.fn() }));

function childFixture() {
  const emitter = new EventEmitter();
  return Object.assign(emitter, {
    pid: 123,
    exitCode: null as number | null,
    signalCode: null as NodeJS.Signals | null,
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    kill: vi.fn(() => {
      emitter.emit('exit', 0, null);
      return true;
    }),
  });
}

let child: ReturnType<typeof childFixture>;
beforeEach(() => {
  child = childFixture();
  // The process boundary only needs the event and stream surface used by the launcher.
  vi.mocked(fork).mockReturnValue(child as unknown as ChildProcess);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

async function waitForFork() {
  await vi.waitFor(() => expect(fork).toHaveBeenCalled());
}

describe('createVitevalServer process lifecycle', () => {
  it('should ignore a readiness watchdog already queued when the child becomes ready', async () => {
    const timeout = vi.spyOn(globalThis, 'setTimeout');
    const server = createVitevalServer();
    const started = server.start();
    await waitForFork();
    const watchdog = timeout.mock.calls.find(
      ([, delay]) => delay === 10_000
    )?.[0];
    if (typeof watchdog !== 'function')
      throw new Error('Missing readiness watchdog');
    child.emit('message', { type: 'ready' });
    await started;
    watchdog();
    expect(child.kill).not.toHaveBeenCalled();
    await server.shutdown();
  });
  it('should reject exit waiting before start and allow shutdown before start', async () => {
    const server = createVitevalServer();
    await expect(server.waitForExit()).rejects.toThrow('has not been started');
    await expect(server.shutdown()).resolves.toBeUndefined();
  });
  it('should configure the child root and production environment and stop gracefully', async () => {
    const server = createVitevalServer({ root: '.', port: 0 });
    const started = server.start();
    await waitForFork();
    child.emit('message', null);
    child.emit('message', 'ready');
    child.emit('message', { type: 'not-ready' });
    child.stdout.emit('data', Buffer.from('starting'));
    child.stderr.emit('data', Buffer.from('diagnostic'));
    child.emit('message', { type: 'ready' });
    const port = await started;
    expect(port).toBeGreaterThan(0);
    expect(fork).toHaveBeenCalledWith(
      expect.stringContaining('production-server.mjs'),
      expect.objectContaining({
        cwd: path.resolve('.'),
        env: expect.objectContaining({
          VITEVAL_ROOT_PATH: path.resolve('.'),
          VITEVAL_DEBUG_MODE: 'false',
          PORT: String(port),
          NODE_ENV: 'production',
          HOSTNAME: 'localhost',
        }),
        stdio: 'pipe',
      })
    );
    await expect(server.start()).rejects.toThrow('already running');
    await server.shutdown();
    await expect(server.waitForExit()).resolves.toBeUndefined();
    expect(child.kill).toHaveBeenCalledOnce();
  });
  it.each(['Ready', 'started server'])(
    'should accept split stdout readiness marker %s',
    async (marker) => {
      const server = createVitevalServer();
      const started = server.start();
      await waitForFork();
      child.stdout.emit('data', Buffer.from(marker.slice(0, 2)));
      child.stdout.emit('data', Buffer.from(marker.slice(2)));
      await expect(started).resolves.toBeGreaterThan(0);
      child.emit('message', { type: 'ready' });
      await server.shutdown();
    }
  );
  it('should forward diagnostic streams only in debug mode', async () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    const server = createVitevalServer({ debug: true });
    const started = server.start();
    await waitForFork();
    child.stderr.emit('data', Buffer.from('stderr message'));
    child.stdout.emit('data', Buffer.from('Ready'));
    await started;
    expect(stderr).toHaveBeenCalledWith('stderr message');
    expect(stdout).toHaveBeenCalledWith('Ready');
    await server.shutdown();
  });
  it.each([
    [1, null],
    [null, 'SIGTERM'],
  ] as const)(
    'should reject startup and exit waiting when the child exits early (%s, %s)',
    async (code, signal) => {
      const server = createVitevalServer();
      const started = server.start();
      const rejected = expect(started).rejects.toThrow('exited before ready');
      await waitForFork();
      child.emit('exit', code, signal);
      await rejected;
      await expect(server.waitForExit()).rejects.toThrow('exited unexpectedly');
      await server.shutdown();
    }
  );
  it('should reject startup when spawning the child fails', async () => {
    const server = createVitevalServer();
    const started = server.start();
    const rejected = expect(started).rejects.toThrow('spawn failed');
    await waitForFork();
    child.emit('error', new Error('spawn failed'));
    await rejected;
    await expect(server.waitForExit()).rejects.toThrow('spawn failed');
    await server.shutdown();
  });
  it('should reject unexpected exits after successful startup', async () => {
    const server = createVitevalServer();
    const started = server.start();
    await waitForFork();
    child.emit('message', { type: 'ready' });
    await started;
    child.emit('exit', 2, null);
    await expect(server.waitForExit()).rejects.toThrow('code=2');
    await server.shutdown();
  });
  it('should kill a child that never announces readiness', async () => {
    vi.useFakeTimers();
    const server = createVitevalServer();
    const started = server.start();
    const rejected = expect(started).rejects.toThrow('did not become ready');
    await waitForFork();
    await vi.advanceTimersByTimeAsync(10_000);
    await rejected;
    expect(child.kill).toHaveBeenCalledOnce();
  });
  it('should restart with a fresh child process', async () => {
    const server = createVitevalServer();
    const first = server.start();
    await waitForFork();
    child.emit('message', { type: 'ready' });
    await first;
    const nextChild = childFixture();
    vi.mocked(fork).mockReturnValue(nextChild as unknown as ChildProcess);
    const restarted = server.restart();
    await vi.waitFor(() => expect(fork).toHaveBeenCalledTimes(2));
    nextChild.emit('message', { type: 'ready' });
    await expect(restarted).resolves.toBeGreaterThan(0);
    await server.shutdown();
    expect(child.kill).toHaveBeenCalledOnce();
    expect(nextChild.kill).toHaveBeenCalledOnce();
  });
});
