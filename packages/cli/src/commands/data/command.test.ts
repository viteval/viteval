import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVitest, type Reporter, type Vitest } from 'vitest/node';
import {
  mockLog,
  mockStatus,
  runHandler as runNativeHandler,
} from 'maltty/test';
import { dataCommand } from './command';

// The native worker-process boundary is simulated; discovery and generated files are real.
vi.mock('vitest/node', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vitest/node')>()),
  createVitest: vi.fn(),
}));

let root: string, reporter: Reporter;
const directories: string[] = [],
  originalExitCode = process.exitCode,
  originalTty = Object.getOwnPropertyDescriptor(process.stderr, 'isTTY');

beforeEach(async () => {
  vi.mocked(createVitest).mockReset();
  root = await mkdtemp(path.join(tmpdir(), 'viteval-data-unit-'));
  directories.push(root);
  Object.defineProperty(process.stderr, 'isTTY', {
    configurable: true,
    value: false,
  });
});
afterEach(async () => {
  vi.restoreAllMocks();
  process.exitCode = originalExitCode;
  if (originalTty) Object.defineProperty(process.stderr, 'isTTY', originalTty);
  else Reflect.deleteProperty(process.stderr, 'isTTY');
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('dataCommand', () => {
  it('should honor the configured root when no explicit CLI root is provided', async () => {
    await writeFile(path.join(root, 'questions.dataset.ts'), '');
    vi.spyOn(process, 'cwd').mockReturnValue(root);
    const native = nativeWorker();
    await runHandler({ cmd: dataCommand });
    expect(vi.mocked(createVitest).mock.calls[0][0]?.root).toBeUndefined();
    expect(native.runTestSpecifications).toHaveBeenCalledOnce();
  });
  it('should discover modules, instrument only matched IDs, and remove generated worker files', async () => {
    await writeFile(
      path.join(root, 'questions.dataset.ts'),
      'export const value = 1;'
    );
    const native = nativeWorker(),
      status = mockStatus();
    Object.defineProperty(process.stderr, 'isTTY', {
      configurable: true,
      value: true,
    });
    native.runTestSpecifications.mockImplementation(async () => {
      const options = vi.mocked(createVitest).mock.calls[0][1],
        plugins = options?.plugins ?? [],
        plugin = plugins[1];
      if (
        !plugin ||
        typeof plugin !== 'object' ||
        !('transform' in plugin) ||
        typeof plugin.transform !== 'function'
      )
        throw new Error('missing transform');
      expect(
        plugin.transform.call(
          {},
          'export const value = 1;',
          `${path.join(root, 'questions.dataset.ts')}?v=1`
        )
      ).toMatchObject({
        map: null,
        code: expect.stringContaining('finishModule'),
      });
      expect(plugin.transform.call({}, '', '/unmatched.ts')).toBeUndefined();
      expect(plugin.transform.call({}, '', '')).toBeUndefined();
      const files = await readdir(path.join(root, '.viteval'));
      expect(files).toHaveLength(2);
      const worker = files.find((file) => file.endsWith('.test.mjs'))!;
      expect(
        await readFile(path.join(root, '.viteval', worker), 'utf8')
      ).toContain('questions.dataset.ts');
      reporter.onTestModuleCollected?.(testModule([testCase({})]));
      reporter.onTestCaseResult?.(
        testCase({
          artifact: {
            type: 'viteval:dataset',
            name: 'questions',
            kind: 'generated',
          },
        })
      );
      return { testModules: [], unhandledErrors: [] };
    });
    const result = await runHandler({
      cmd: dataCommand,
      overrides: { args: { root }, status },
    });
    expect(result.error).toBeUndefined();
    expect(result.stdout()).toContain('Generated 1 datasets');
    expect(status.progress).toHaveBeenCalledWith({ max: 1 });
    expect(native.close).toHaveBeenCalledOnce();
    expect(await readdir(path.join(root, '.viteval'))).toEqual([]);
  });

  it.each([false, true])(
    'should report missing named projects (name returned: %s)',
    async (matched) => {
      const native = nativeWorker();
      if (matched)
        native.getProjectByName.mockImplementation(() => {
          throw new Error('native project error');
        });
      else native.project.name = 'other';
      const result = await runHandler({
        cmd: dataCommand,
        overrides: { args: { root, project: 'missing' } },
      });
      expect(result.stdout()).toContain(
        matched ? 'native project error' : 'was not found'
      );
      expect(process.exitCode).toBe(1);
      expect(native.close).toHaveBeenCalledOnce();
    }
  );

  it('should close the native worker when no matching datasets exist', async () => {
    const native = nativeWorker(),
      result = await runHandler({
        cmd: dataCommand,
        overrides: { args: { root } },
      });
    expect(result.stdout()).toContain('No datasets found matching pattern');
    expect(native.close).toHaveBeenCalledOnce();
    expect(process.exitCode).toBe(1);
  });

  it('should ignore ordinary tests, validate artifacts, and count skipped datasets', async () => {
    await writeFile(path.join(root, 'questions.dataset.ts'), '');
    const native = nativeWorker();
    native.runTestSpecifications.mockImplementation(async () => {
      reporter.onTestModuleCollected?.(testModule([]));
      reporter.onTestCaseResult?.(testCase({ meta: {} }));
      reporter.onTestCaseResult?.(testCase({}));
      reporter.onTestCaseResult?.(
        testCase({
          id: 'saved',
          artifact: { type: 'viteval:dataset', name: 'saved', kind: 'skipped' },
          invalidArtifacts: [
            undefined,
            null,
            false,
            {},
            { type: 'other' },
            { type: 'viteval:dataset' },
            { type: 'viteval:dataset', name: 3 },
            { type: 'viteval:dataset', name: 'wrong' },
            { type: 'viteval:dataset', name: 'wrong', kind: 'invalid' },
          ],
        })
      );
      return { testModules: [], unhandledErrors: [] };
    });
    const result = await runHandler({
      cmd: dataCommand,
      overrides: { args: { root } },
    });
    expect(result.stdout()).toContain('Skipped 2 datasets');
    expect(result.stdout()).toContain('Generated 0 datasets');
  });

  it.each([false, true])(
    'should report dataset failures with configurable detail (verbose: %s)',
    async (verbose) => {
      await writeFile(path.join(root, 'questions.dataset.ts'), '');
      const native = nativeWorker();
      native.runTestSpecifications.mockImplementation(async () => {
        reporter.onTestCaseResult?.(
          testCase({
            state: 'failed',
            errors: [{ message: 'generator exploded' }],
          })
        );
        reporter.onTestCaseResult?.(
          testCase({
            id: 'artifact failure',
            artifact: {
              type: 'viteval:dataset',
              name: 'artifact failure',
              kind: 'failed',
              error: 'upload failed',
            },
          })
        );
        reporter.onTestCaseResult?.(
          testCase({
            id: 'named failure',
            state: 'failed',
            artifact: {
              type: 'viteval:dataset',
              name: 'named dataset',
              kind: 'generated',
            },
            errors: [{ message: 'named failure' }],
          })
        );
        return { testModules: [], unhandledErrors: [] };
      });
      const result = await runHandler({
        cmd: dataCommand,
        overrides: { args: { root, verbose } },
      });
      expect(result.stdout()).toContain('Failed to generate 3 datasets');
      expect(result.stdout()).toContain('Successfully generated 0 datasets');
      if (verbose) expect(result.stdout()).toContain('generator exploded');
      expect(process.exitCode).toBe(1);
    }
  );

  it.each([false, true])(
    'should propagate module and worker execution failures (module errors: %s)',
    async (errors) => {
      await writeFile(path.join(root, 'questions.dataset.ts'), '');
      const native = nativeWorker();
      native.runTestSpecifications.mockResolvedValue({
        testModules: [
          {
            errors: () => (errors ? [{ message: 'module failed' }] : []),
            ok: () => false,
          },
        ],
        unhandledErrors: errors
          ? [new Error('worker failed'), 'plain failure']
          : [],
      });
      const result = await runHandler({
        cmd: dataCommand,
        overrides: { args: { root } },
      });
      if (errors)
        expect(result.stdout()).toContain(
          'module failed\nworker failed\nplain failure'
        );
      expect(process.exitCode).toBe(1);
      expect(native.close).toHaveBeenCalledOnce();
    }
  );

  it.each([new Error('worker unavailable'), 'unknown native failure'])(
    'should report native startup failures: %s',
    async (error) => {
      vi.mocked(createVitest).mockRejectedValue(error);
      const result = await runHandler({
        cmd: dataCommand,
        overrides: { args: { root } },
      });
      expect(result.stdout()).toContain(
        error instanceof Error ? error.message : 'Unknown error'
      );
      expect(process.exitCode).toBe(1);
    }
  );

  it('should still remove generated files when native shutdown fails', async () => {
    await writeFile(path.join(root, 'questions.dataset.ts'), '');
    const native = nativeWorker();
    native.close.mockRejectedValue(new Error('shutdown failed'));
    const result = await runHandler({
      cmd: dataCommand,
      overrides: { args: { root, project: 'datasets', overwrite: true } },
    });
    expect(result.stdout()).toContain('shutdown failed');
    expect(await readdir(path.join(root, '.viteval'))).toEqual([]);
  });

  it('should report filesystem failures before worker creation', async () => {
    await writeFile(path.join(root, 'questions.dataset.ts'), '');
    await writeFile(path.join(root, '.viteval'), 'not a directory');
    const native = nativeWorker(),
      result = await runHandler({
        cmd: dataCommand,
        overrides: { args: { root } },
      });
    expect(result.stdout()).toContain('Failed to generate datasets');
    expect(native.close).toHaveBeenCalledOnce();
    expect(native.runTestSpecifications).not.toHaveBeenCalled();
  });
});

function nativeWorker() {
  const project = {
      name: 'datasets',
      config: { root, setupFiles: [], sequence: {}, tags: [] },
      createSpecification: vi.fn((file) => ({ file })),
    },
    native = {
      project,
      getProjectByName: vi.fn(() => project),
      getRootProject: vi.fn(() => project),
      close: vi.fn(async () => {}),
      runTestSpecifications: vi.fn(async () => ({
        testModules: [],
        unhandledErrors: [],
      })),
    };
  vi.mocked(createVitest).mockImplementation(async (options) => {
    reporter = options?.reporters?.[0] as Reporter;
    return native as unknown as Vitest;
  });
  return native;
}

async function runHandler(options: Parameters<typeof runNativeHandler>[0]) {
  const log = mockLog(),
    result = await runNativeHandler({
      ...options,
      overrides: { ...options.overrides, log },
    });
  return {
    ...result,
    stdout: () =>
      [log.error, log.info, log.success]
        .flatMap((method) => vi.mocked(method).mock.calls.flat())
        .join('\n'),
  };
}

function testModule(tests: ReturnType<typeof testCase>[]) {
  return { children: { allTests: () => tests } } as unknown as Parameters<
    NonNullable<Reporter['onTestModuleCollected']>
  >[0];
}

function testCase({
  id = 'case',
  meta = { vitevalDataset: true },
  artifact,
  invalidArtifacts = [],
  state = 'passed',
  errors = [],
}: {
  id?: string;
  meta?: Record<string, unknown>;
  artifact?: Record<string, unknown>;
  invalidArtifacts?: unknown[];
  state?: string;
  errors?: { message: string }[];
}) {
  return {
    id,
    name: 'questions',
    meta: () => meta,
    artifacts: () =>
      artifact ? [artifact, ...invalidArtifacts] : invalidArtifacts,
    result: () => ({ state, errors }),
  } as unknown as Parameters<NonNullable<Reporter['onTestCaseResult']>>[0];
}
