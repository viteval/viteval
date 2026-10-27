import { EventEmitter } from 'node:events';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runNodeCli } from './node-cli';

vi.mock('node:child_process', () => ({ spawn: vi.fn() }));

const directories: string[] = [],
  originalExitCode = process.exitCode;

beforeEach(() => vi.mocked(spawn).mockReset());
afterEach(async () => {
  vi.restoreAllMocks();
  process.exitCode = originalExitCode;
  await Promise.all(
    directories
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true }))
  );
});

describe('runNodeCli', () => {
  it.each([
    { code: 0, signal: null, expected: 0 },
    { code: 3, signal: null, expected: 3 },
    { code: null, signal: 'SIGTERM', expected: 143 },
    { code: null, signal: null, expected: 1 },
  ])(
    'should preserve native process outcomes: $expected',
    async ({ code, signal, expected }) => {
      const root = await project('viteval'),
        child = childProcess();
      vi.mocked(spawn).mockImplementation(() => {
        queueMicrotask(() => child.emit('exit', code, signal));
        return child;
      });
      await runNodeCli(['--cwd', root, 'list', '--root', root, '--json']);
      expect(spawn).toHaveBeenCalledWith(
        'node',
        [
          path.join(root, 'node_modules/viteval/cli.mjs'),
          'list',
          '--root',
          root,
          '--json',
        ],
        { stdio: 'inherit' }
      );
      expect(process.exitCode).toBe(expected);
    }
  );

  it.each(['--root=', '-r'])(
    'should find scoped CLI packages in ancestors with %s',
    async (flag) => {
      const root = await project('@viteval/cli'),
        nested = path.join(root, 'nested/deep');
      await mkdir(nested, { recursive: true });
      vi.mocked(spawn).mockImplementation(() => {
        const child = childProcess();
        queueMicrotask(() => child.emit('exit', 0, null));
        return child;
      });
      const args = flag === '-r' ? [flag, nested] : [`${flag}${nested}`];
      await runNodeCli(args);
      expect(vi.mocked(spawn).mock.calls[0][1]?.[0]).toBe(
        path.join(root, 'node_modules/@viteval/cli/cli.mjs')
      );
    }
  );

  it('should fall back to the current project and forward interruption signals', async () => {
    const root = await project('viteval'),
      child = childProcess(),
      kill = vi.fn();
    child.kill = kill;
    vi.spyOn(process, 'cwd').mockReturnValue(root);
    const interrupts = process.listenerCount('SIGINT'),
      terminations = process.listenerCount('SIGTERM');
    vi.mocked(spawn).mockImplementation(() => {
      queueMicrotask(() => {
        process.emit('SIGINT');
        process.emit('SIGTERM');
        child.emit('exit', 0, null);
      });
      return child;
    });
    await runNodeCli(['run']);
    expect(kill.mock.calls).toEqual([['SIGINT'], ['SIGTERM']]);
    expect(process.listenerCount('SIGINT')).toBe(interrupts);
    expect(process.listenerCount('SIGTERM')).toBe(terminations);
  });

  it('should reject spawn errors and remove its process listeners', async () => {
    const root = await project('viteval'),
      child = childProcess(),
      error = new Error('node unavailable'),
      count = process.listenerCount('SIGTERM');
    const observed = vi.fn();
    child.on('error', observed);
    vi.mocked(spawn).mockImplementation(() => {
      queueMicrotask(() => child.emit('error', error));
      return child;
    });
    await expect(runNodeCli(['run', '--root', root])).rejects.toBe(error);
    expect(observed).toHaveBeenCalledOnce();
    expect(process.listenerCount('SIGTERM')).toBe(count);
  });

  it('should explain how to install the CLI when neither package is available', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'viteval-missing-cli-'));
    directories.push(root);
    vi.spyOn(process, 'cwd').mockReturnValue(root);
    await expect(runNodeCli([])).rejects.toThrow(
      'Install viteval in your project'
    );
    expect(spawn).not.toHaveBeenCalled();
  });
});

async function project(name: string) {
  const root = await mkdtemp(path.join(tmpdir(), 'viteval-node-cli-')),
    entry = path.join(root, 'node_modules', name, 'cli.mjs');
  directories.push(root);
  await mkdir(path.dirname(entry), { recursive: true });
  await writeFile(entry, '');
  return root;
}

function childProcess() {
  return Object.assign(new EventEmitter(), { kill: vi.fn() }) as ChildProcess;
}
