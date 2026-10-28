import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVitest, type Vitest } from 'vitest/node';
import { mockLog, runHandler, type HandlerResult } from 'maltty/test';
import { listCommand, listEvaluations } from './command';

vi.mock('vitest/node', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vitest/node')>()),
  createVitest: vi.fn(),
}));

const originalExitCode = process.exitCode,
  directories: string[] = [];
let jsonOutput: string[] = [];

beforeEach(() => {
  vi.mocked(createVitest).mockReset();
  jsonOutput = [];
  vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    jsonOutput.push(String(chunk));
    return true;
  });
});

afterEach(async () => {
  vi.restoreAllMocks();
  process.exitCode = originalExitCode;
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

interface Invocation extends HandlerResult<Record<string, unknown>> {
  json: () => string | undefined;
  stdout: () => string;
}

describe('listEvaluations', () => {
  it('should collect names dynamically and print sorted JSON', async () => {
    const native = nativeRunner(
      [
        module('src/greet.eval.ts', ['greeting accuracy']),
        module('src/basic.eval.ts', ['basic usage']),
      ],
      []
    );
    const invocation = await invokeList({ root: process.cwd(), json: true }, [
      'viteval',
      'list',
      '--root',
      process.cwd(),
      'basic.eval.ts',
    ]);
    expect(invocation.error).toBeUndefined();
    expect(native.collect).toHaveBeenCalledWith(['basic.eval.ts'], {
      staticParse: false,
    });
    expect(vi.mocked(createVitest).mock.calls[0][0]).toEqual({
      config: false,
      root: process.cwd(),
      run: true,
      watch: false,
    });
    expect(native.close).toHaveBeenCalledOnce();
    expect(invocation.json()).toBe(
      `${JSON.stringify(
        [
          { name: 'basic usage', file: 'src/basic.eval.ts' },
          { name: 'greeting accuracy', file: 'src/greet.eval.ts' },
        ],
        null,
        2
      )}\n`
    );
    expect(process.exitCode).toBe(originalExitCode);
  });

  it('should print discovered names without JSON', async () => {
    nativeRunner([module('src/one.eval.ts', ['first eval'])], []);
    const invocation = await invokeList({}, ['viteval', 'list', 'one.eval.ts']);
    expect(invocation.stdout()).toContain('first eval');
    expect(invocation.json()).toBeUndefined();
    expect(process.exitCode).toBe(originalExitCode);
  });

  it('should report empty projects without failing', async () => {
    nativeRunner([], []);
    const log = mockLog();
    await listEvaluations({ argv: {}, log });
    expect(log.info).toHaveBeenCalledWith('No evaluations found');
    expect(process.exitCode).toBe(originalExitCode);
  });

  it('should surface collection failures and suppress the listing', async () => {
    nativeRunner(
      [
        module(
          'src/broken.eval.ts',
          ['broken eval'],
          [{ message: 'module failed' }]
        ),
      ],
      [new Error('unhandled collection failure'), 'plain failure']
    );
    const invocation = await invokeList({ json: true });
    expect(invocation.stdout()).toContain('module failed');
    expect(invocation.stdout()).toContain('unhandled collection failure');
    expect(invocation.stdout()).toContain('plain failure');
    expect(jsonOutput).toEqual([]);
    expect(process.exitCode).toBe(1);
  });

  it(
    'should list evaluations through real collection without running paid generators',
    { timeout: 120_000 },
    async () => {
      const { real, project } = await realProject({
        'viteval.config.ts': `import { defineConfig } from 'viteval/config';
export default defineConfig({ eval: { include: ['unpaid.ts'] } });`,
        'unpaid.ts': `import { evaluate, scorers } from 'viteval';

evaluate('paid work must not run', {
  data: () => {
    throw new Error('PAID GENERATOR RAN');
  },
  task: () => {
    throw new Error('PAID TASK RAN');
  },
  scorers: [scorers.exactMatch()],
});

evaluate('inline cases', {
  data: [{ input: 'q', expected: 'a' }],
  task: () => {
    throw new Error('PAID TASK RAN');
  },
  scorers: [scorers.exactMatch()],
});
`,
      });
      vi.mocked(createVitest).mockImplementation(async (options, vite) =>
        real(options, vite)
      );
      const invocation = await invokeList({ root: project });
      expect(invocation.error).toBeUndefined();
      expect(invocation.stdout()).toContain('paid work must not run');
      expect(invocation.stdout()).toContain('inline cases');
      expect(invocation.stdout()).not.toContain('PAID GENERATOR RAN');
      expect(invocation.stdout()).not.toContain('PAID TASK RAN');
      expect(process.exitCode).toBe(originalExitCode);
    }
  );
});

interface ModuleFixture {
  children: { suites: () => { name: string }[] };
  errors: () => { message: string }[];
  relativeModuleId: string;
}

function module(
  file: string,
  suites: string[],
  errors: { message: string }[] = []
): ModuleFixture {
  return {
    children: { suites: () => suites.map((name) => ({ name })) },
    errors: () => errors,
    relativeModuleId: file,
  };
}

function nativeRunner(modules: ModuleFixture[], unhandledErrors: unknown[]) {
  const native = {
    start: vi.fn(async () => ({ testModules: [], unhandledErrors: [] })),
    collect: vi.fn(async () => ({ testModules: modules, unhandledErrors })),
    close: vi.fn(async () => {}),
    cancelCurrentRun: vi.fn(async () => {}),
  };
  vi.mocked(createVitest).mockImplementation(async () => native as Vitest);
  return native;
}

async function realProject(files: Record<string, string>) {
  const real =
    await vi.importActual<typeof import('vitest/node')>('vitest/node');
  const project = await mkdtemp(path.join(tmpdir(), 'viteval-list-real-'));
  directories.push(project);
  await mkdir(path.join(project, 'node_modules'), { recursive: true });
  await symlink(
    path.resolve(import.meta.dirname, '../../../../viteval'),
    path.join(project, 'node_modules/viteval'),
    'junction'
  );
  await symlink(
    path.resolve(import.meta.dirname, '../../../node_modules/vitest'),
    path.join(project, 'node_modules/vitest'),
    'junction'
  );
  await writeFile(
    path.join(project, 'package.json'),
    '{"name":"consumer","type":"module"}'
  );
  for (const [name, source] of Object.entries(files)) {
    await writeFile(path.join(project, name), source);
  }
  return { real: real.createVitest, project };
}

async function invokeList(
  args: Record<string, unknown>,
  tokens: readonly string[] = ['viteval', 'list']
): Promise<Invocation> {
  const log = mockLog(),
    [command = 'list', ...commandArgs] = tokens.slice(1),
    result = await runHandler({
      cmd: listCommand,
      overrides: { args, log, meta: { command: [command, ...commandArgs] } },
    });
  return {
    ...result,
    json: () => jsonOutput.at(0),
    stdout: () =>
      [log.error, log.info]
        .flatMap((method) => vi.mocked(method).mock.calls.flat())
        .join('\n'),
  };
}
