import { EventEmitter } from 'node:events';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVitest, type Vitest } from 'vitest/node';
import { cli, type Command } from 'maltty';
import { createTestContext } from 'maltty/test';

vi.mock('maltty', async (importOriginal) => ({
  ...(await importOriginal<typeof import('maltty')>()),
  cli: vi.fn(async () => {}),
}));
vi.mock('vitest/node', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vitest/node')>()),
  createVitest: vi.fn(),
}));
vi.mock('node:child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:child_process')>()),
  spawn: vi.fn(),
}));

const originalArgv = process.argv,
  originalCwd = process.cwd(),
  originalExitCode = process.exitCode;
const directories: string[] = [];
let root: string,
  native: {
    start: ReturnType<typeof vi.fn>;
    collect: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    cancelCurrentRun: ReturnType<typeof vi.fn>;
  };

beforeEach(async () => {
  vi.resetModules();
  vi.mocked(cli).mockClear();
  vi.mocked(createVitest).mockReset();
  vi.mocked(spawn).mockClear();
  native = {
    start: vi.fn(async () => ({ testModules: [], unhandledErrors: [] })),
    collect: vi.fn(async () => ({ testModules: [], unhandledErrors: [] })),
    close: vi.fn(async () => {}),
    cancelCurrentRun: vi.fn(async () => {}),
  };
  vi.mocked(createVitest).mockImplementation(async () => native as Vitest);
  root = await mkdtemp(path.join(tmpdir(), 'viteval-dispatcher-'));
  directories.push(root);
  process.chdir(root);
  vi.mocked(spawn).mockImplementation(() => {
    const child = Object.assign(new EventEmitter(), {
      kill: vi.fn(),
    }) as ChildProcess;
    queueMicrotask(() => child.emit('exit', 0, null));
    return child;
  });
});

afterEach(async () => {
  vi.restoreAllMocks();
  process.argv = originalArgv;
  process.chdir(originalCwd);
  process.exitCode = originalExitCode;
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('Node CLI dispatch', () => {
  it.each([
    'init',
    'data',
    'ui',
    'run',
    'list',
    '--help',
    '-h',
    '--version',
    '-v',
  ])('should route %s through the project command shell', async (argument) => {
    process.argv = ['node', 'viteval', argument];
    await import('./index');
    expect(cli).toHaveBeenCalledWith(
      expect.objectContaining({
        help: expect.objectContaining({
          order: ['run', 'list', 'init', 'data', 'ui'],
        }),
        name: 'viteval',
        commands: expect.objectContaining({
          init: expect.any(Object),
          data: expect.any(Object),
          run: expect.any(Object),
          list: expect.any(Object),
          ui: expect.any(Object),
        }),
      })
    );
    expect(createVitest).not.toHaveBeenCalled();
  });

  it('should register evaluation commands with their supported option surface', async () => {
    process.argv = ['node', 'viteval', '--help'];
    await import('./index');
    const commands = vi.mocked(cli).mock.calls[0][0].commands as Record<
      string,
      Command
    >;
    expect(commands.run.options).toMatchObject({
      watch: { type: 'boolean' },
      timeout: { type: 'number' },
      concurrency: { type: 'number' },
      retries: { type: 'number' },
      name: { type: 'string' },
    });
    expect(commands.list.options).toMatchObject({ json: { type: 'boolean' } });
    expect(commands.data.options).not.toHaveProperty('project');
  });

  it('should run evaluations directly on bare invocation', async () => {
    process.argv = ['node', 'viteval'];
    await import('./index');
    expect(cli).not.toHaveBeenCalled();
    expect(native.start).toHaveBeenCalledWith([]);
    expect(native.close).toHaveBeenCalledOnce();
    expect(process.exitCode).toBe(originalExitCode);
  });

  it('should apply working-directory overrides to bare evaluation runs', async () => {
    process.argv = ['node', 'viteval', '--cwd', root];
    await import('./index');
    expect(process.cwd()).toBe(
      await import('node:fs/promises').then((fs) => fs.realpath(root))
    );
    expect(cli).not.toHaveBeenCalled();
    expect(native.start).toHaveBeenCalledWith([]);
  });

  it('should normalize shorthand file filters into a run command', async () => {
    process.argv = ['node', 'viteval', 'a.eval.ts', 'b.eval.ts'];
    await import('./index');
    expect(process.argv).toEqual([
      'node',
      'viteval',
      'run',
      'a.eval.ts',
      'b.eval.ts',
    ]);
    expect(cli).toHaveBeenCalledOnce();
  });

  it('should lazily execute the registered list handler', async () => {
    process.argv = ['node', 'viteval', '--help'];
    await import('./index');
    const commands = vi.mocked(cli).mock.calls[0][0].commands as Record<
      string,
      Command
    >;
    await commands.list.handler?.(
      createTestContext({ args: {}, meta: { command: ['list'] } }).ctx
    );
    expect(native.collect).toHaveBeenCalledWith([], { staticParse: false });
    expect(native.close).toHaveBeenCalledOnce();
  });

  it('should reject working-directory overrides without a directory', async () => {
    process.argv = ['node', 'viteval', '--cwd'];
    await expect(import('./index')).rejects.toThrow(
      '--cwd requires a directory'
    );
  });

  it('should lazily execute the registered run handler with raw file filters', async () => {
    process.argv = ['node', 'viteval', '--help'];
    await import('./index');
    const commands = vi.mocked(cli).mock.calls[0][0].commands as Record<
      string,
      Command
    >;
    const context = createTestContext({
      args: { name: 'greeting' },
      meta: {
        command: ['run', '--name', 'greeting', 'a.eval.ts', 'b.eval.ts'],
      },
    });
    await commands.run.handler?.(context.ctx);
    expect(native.start).toHaveBeenCalledWith(['a.eval.ts', 'b.eval.ts']);
    expect(vi.mocked(createVitest).mock.calls[0][0]).toMatchObject({
      testNamePattern: 'greeting',
      run: true,
      watch: false,
    });
    expect(native.close).toHaveBeenCalledOnce();
  });

  it('should keep project handler validation intact', async () => {
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
