import { EventEmitter } from 'node:events';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCLI } from 'vitest/node';
import { cli, type Command } from 'maltty';
import { createTestContext } from 'maltty/test';

vi.mock('maltty', async (importOriginal) => ({
  ...(await importOriginal<typeof import('maltty')>()),
  cli: vi.fn(async () => {}),
}));
vi.mock('vitest/node', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vitest/node')>()),
  createCLI: vi.fn(),
}));
vi.mock('node:child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:child_process')>()),
  spawn: vi.fn(),
}));

const originalArgv = process.argv,
  originalCwd = process.cwd(),
  originalExitCode = process.exitCode;
let root: string,
  exitListeners: Set<ReturnType<typeof process.rawListeners>[number]>;
let nativeCli: {
  matchedCommandName?: string;
  options: Record<string, unknown>;
  parse: ReturnType<typeof vi.fn>;
  runMatchedCommand: ReturnType<typeof vi.fn>;
};

beforeEach(async () => {
  vi.resetModules();
  vi.mocked(cli).mockClear();
  vi.mocked(createCLI).mockReset();
  root = await mkdtemp(path.join(tmpdir(), 'viteval-dispatcher-'));
  process.chdir(root);
  exitListeners = new Set(process.rawListeners('exit'));
  nativeCli = {
    options: {},
    parse: vi.fn(() => ({ options: nativeCli.options, args: [] })),
    runMatchedCommand: vi.fn(async () => {}),
  };
  vi.mocked(createCLI).mockReturnValue(
    nativeCli as unknown as ReturnType<typeof createCLI>
  );
  vi.mocked(spawn).mockImplementation(() => {
    const child = Object.assign(new EventEmitter(), {
      kill: vi.fn(),
    }) as ChildProcess;
    queueMicrotask(() => child.emit('exit', 0, null));
    return child;
  });
});
afterEach(async () => {
  for (const listener of process.rawListeners('exit')) {
    if (!exitListeners.has(listener) && listener.name === 'cleanup') {
      listener.call(process, 0);
      process.removeListener('exit', listener);
    }
  }
  vi.restoreAllMocks();
  process.argv = originalArgv;
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  await rm(root, { recursive: true, force: true });
});

describe('Node CLI dispatch', () => {
  it.each([undefined, true, false])(
    'should default list to dynamic collection while preserving explicit static parsing: %s',
    async (staticParse) => {
      process.argv = ['node', 'viteval', 'list', '--json'];
      nativeCli.matchedCommandName = 'list';
      nativeCli.options = { staticParse };
      await import('./index');
      expect(nativeCli.options.staticParse).toBe(staticParse ?? false);
      expect(nativeCli.runMatchedCommand).toHaveBeenCalledOnce();
    }
  );
  it.each(['init', 'data', 'ui', '--help', '-h', '--version', '-v'])(
    'should route %s through project command parsing',
    async (argument) => {
      process.argv = ['node', 'viteval', argument];
      await import('./index');
      expect(cli).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'viteval',
          commands: expect.objectContaining({
            init: expect.any(Object),
            data: expect.any(Object),
            ui: expect.any(Object),
            run: expect.any(Object),
          }),
        })
      );
      expect(createCLI).not.toHaveBeenCalled();
    }
  );

  it('should lazily dispatch real project handlers with their validation intact', async () => {
    process.argv = ['node', 'viteval', '--help'];
    await import('./index');
    const commands = vi.mocked(cli).mock.calls[0][0].commands as Record<
      string,
      Command
    >;
    await expect(
      commands.data.handler?.(createTestContext({ args: { pattern: 1 } }).ctx)
    ).rejects.toThrow();
    await expect(
      commands.ui.handler?.(createTestContext({ args: { port: 0 } }).ctx)
    ).rejects.toThrow();
  });

  it.each(['--help', '-h', '--version', '-v'])(
    'should preserve native subcommand %s without loading a project',
    async (flag) => {
      process.argv = ['node', 'viteval', 'list', flag];
      await import('./index');
      expect(nativeCli.parse).toHaveBeenCalledWith([
        'node',
        'viteval',
        'list',
        flag,
      ]);
      expect(nativeCli.runMatchedCommand).not.toHaveBeenCalled();
    }
  );

  it('should normalize explicit relative roots without replacing native subcommand actions', async () => {
    await mkdir(path.join(root, 'app'));
    nativeCli.options = { root: './app', config: false, testTimeout: 456 };
    process.argv = ['node', 'viteval', 'bench', '--root', './app'];
    await import('./index');
    expect(nativeCli.options.root).toBe(path.join(process.cwd(), 'app'));
    expect(nativeCli.options.testTimeout).toBe(456);
    expect(nativeCli.runMatchedCommand).toHaveBeenCalledOnce();
    expect(await readFile(String(nativeCli.options.config), 'utf8')).toContain(
      'createRunnerConfig'
    );
    expect(nativeCli.parse).toHaveBeenCalledWith(
      ['node', 'viteval', 'bench', '--root', './app'],
      { run: false }
    );
  });

  it('should apply working-directory overrides while leaving inferred roots to project config', async () => {
    await writeFile(path.join(root, 'viteval.config.ts'), 'export default {};');
    process.argv = ['node', 'viteval', '--cwd', root, 'list', '--json'];
    await import('./index');
    expect(process.cwd()).toBe(
      await import('node:fs/promises').then((fs) => fs.realpath(root))
    );
    expect(nativeCli.options.root).toBeUndefined();
    expect(nativeCli.runMatchedCommand).toHaveBeenCalledOnce();
    expect(nativeCli.parse).toHaveBeenCalledWith(
      ['node', 'viteval', 'list', '--json'],
      { run: false }
    );
  });

  it('should preserve native dispatcher failures', async () => {
    process.argv = ['node', 'viteval', 'run'];
    nativeCli.runMatchedCommand.mockRejectedValue(
      new Error('native dispatch failed')
    );
    await expect(import('./index')).rejects.toThrow('native dispatch failed');
  });
});

describe('compiled CLI dispatch', () => {
  it.each(['init', 'data', 'ui', '--help'])(
    'should route %s through the compiled project shell',
    async (argument) => {
      process.argv = ['node', 'viteval', argument];
      await import('./native/index');
      expect(cli).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'viteval' })
      );
    }
  );

  it('should forward native evaluation commands through the installed Node CLI', async () => {
    await installCli();
    process.argv = ['node', 'viteval', '--cwd', root, 'list', '--root', root];
    await import('./native/index');
    expect(spawn).toHaveBeenCalledWith(
      'node',
      [path.join(root, 'node_modules/viteval/cli.mjs'), 'list', '--root', root],
      { stdio: 'inherit' }
    );
  });

  it.each(['data', 'ui'])(
    'should forward compiled %s handlers through the Node process boundary',
    async (name) => {
      await installCli();
      process.argv = ['node', 'viteval', name];
      await import('./native/index');
      const commands = vi.mocked(cli).mock.calls[0][0].commands as Record<
        string,
        Command
      >;
      await commands[name].handler?.({
        raw: { argv: [name, name, '--root', root] },
      } as unknown as Parameters<NonNullable<Command['handler']>>[0]);
      expect(spawn).toHaveBeenCalled();
    }
  );

  it.each([new Error('invalid cwd'), 'unusual process failure'])(
    'should report process boundary failures: %s',
    async (error) => {
      process.argv = ['node', 'viteval', '--cwd', root, 'run'];
      vi.spyOn(process, 'chdir').mockImplementation(() => {
        throw error;
      });
      const write = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
      await import('./native/index');
      expect(write).toHaveBeenCalledWith(
        `${error instanceof Error ? error.message : error}\n`
      );
      expect(process.exitCode).toBe(1);
    }
  );

  it('should report missing project dependencies without a cwd override', async () => {
    process.argv = ['node', 'viteval', 'run'];
    const write = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    await import('./native/index');
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining('Install viteval in your project')
    );
    expect(process.exitCode).toBe(1);
  });
});

async function installCli() {
  await mkdir(path.join(root, 'node_modules/viteval'), { recursive: true });
  await writeFile(path.join(root, 'node_modules/viteval/cli.mjs'), '');
}
