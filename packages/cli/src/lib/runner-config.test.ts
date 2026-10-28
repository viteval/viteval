import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveConfig } from 'vitest/node';
import { LIST_VALUE_FLAGS, RUN_VALUE_FLAGS } from './command-options';
import {
  createEvaluationDiscoveryPlugin,
  createRunnerOverrides,
  extractFileFilters,
} from './runner-config';

const cleanups: (() => Promise<unknown>)[] = [];

afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

describe('createRunnerOverrides', () => {
  it('should translate evaluation flags into internal Vitest options', () => {
    const overrides = createRunnerOverrides({
      argv: {
        root: 'relative',
        config: 'viteval.config.ts',
        watch: false,
        timeout: 5000,
        concurrency: 2,
        retries: 1,
        name: 'accuracy',
        coverage: true,
      },
      project: { configFile: '/app/viteval.config.ts', root: '/resolved/app' },
    });
    expect(overrides.test).toEqual({
      config: '/app/viteval.config.ts',
      root: '/resolved/app',
      run: true,
      watch: false,
      testTimeout: 5000,
      maxConcurrency: 2,
      retry: 1,
      testNamePattern: 'accuracy',
      coverage: { enabled: true },
    });
    expect(overrides.vite.plugins).toHaveLength(1);
  });

  it('should leave inferred roots to the project config and omit absent options', () => {
    const overrides = createRunnerOverrides({
      argv: { watch: true },
      project: { root: '/resolved/app' },
    });
    expect(overrides.test).toEqual({
      config: false,
      root: undefined,
      run: false,
      watch: true,
    });
  });

  it('should compose the adapter directly with the resolved config file', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'viteval-overrides-'));
    cleanups.push(() => rm(directory, { recursive: true, force: true }));
    await mkdir(path.join(directory, 'node_modules'));
    await symlink(
      path.resolve(import.meta.dirname, '../../../viteval'),
      path.join(directory, 'node_modules/viteval'),
      'junction'
    );
    await writeFile(
      path.join(directory, 'package.json'),
      '{"name":"consumer","type":"module"}'
    );
    const configFile = path.join(directory, 'viteval.config.ts');
    await writeFile(
      configFile,
      "import { defineConfig } from 'viteval/config'; export default defineConfig({ eval: { timeout: 1234, concurrency: 1 } });"
    );
    const overrides = createRunnerOverrides({
      argv: { root: directory, timeout: 5000, concurrency: 2, retries: 3 },
      project: { configFile, root: directory },
    });
    const resolved = await resolveConfig(overrides.test, overrides.vite);
    expect(resolved.test.testTimeout).toBe(5000);
    expect(resolved.test.maxConcurrency).toBe(2);
    expect(resolved.test.retry).toBe(3);
    expect(resolved.test.root).toBe(
      await import('node:fs/promises').then((fs) => fs.realpath(directory))
    );
    expect(resolved.test.provide.vitevalProjectRoot).toBe(directory);
    expect(resolved.test.provide.vitevalEvalDefaults).toMatchObject({
      timeout: 5000,
      concurrency: 2,
      retries: 3,
    });
  });

  it('should reject native configuration files through the adapter marker', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'viteval-native-'));
    cleanups.push(() => rm(directory, { recursive: true, force: true }));
    const configFile = path.join(directory, 'native.config.mjs');
    await writeFile(
      configFile,
      `export default { root: ${JSON.stringify(directory)} };`
    );
    const overrides = createRunnerOverrides({
      argv: {},
      project: { configFile, root: directory },
    });
    await expect(resolveConfig(overrides.test, overrides.vite)).rejects.toThrow(
      'Expected a Viteval configuration'
    );
  });
});

describe('extractFileFilters', () => {
  it('should collect positional tokens after the command', () => {
    expect(
      extractFileFilters({
        argv: ['viteval', 'run', 'a.eval.ts', 'b.eval.ts'],
        command: 'run',
        valueFlags: RUN_VALUE_FLAGS,
      })
    ).toEqual(['a.eval.ts', 'b.eval.ts']);
  });

  it('should skip values of named options in both spellings', () => {
    expect(
      extractFileFilters({
        argv: [
          'viteval',
          'run',
          '--root',
          'app',
          '--cwd',
          'workspace',
          '--name=My Case',
          '-h',
          '--timeout',
          '50',
          'basic.eval.ts',
        ],
        command: 'run',
        valueFlags: RUN_VALUE_FLAGS,
      })
    ).toEqual(['basic.eval.ts']);
    expect(
      extractFileFilters({
        argv: ['viteval', 'list', '--config', 'viteval.config.ts', 'c.eval.ts'],
        command: 'list',
        valueFlags: LIST_VALUE_FLAGS,
      })
    ).toEqual(['c.eval.ts']);
  });

  it('should treat tokens after -- as literal filters', () => {
    expect(
      extractFileFilters({
        argv: ['viteval', 'run', '--', '--weird.eval.ts', '--root'],
        command: 'run',
        valueFlags: RUN_VALUE_FLAGS,
      })
    ).toEqual(['--weird.eval.ts', '--root']);
  });

  it('should ignore bare invocations and missing command tokens', () => {
    expect(
      extractFileFilters({
        argv: ['viteval', '--cwd', 'app'],
        command: 'run',
        valueFlags: RUN_VALUE_FLAGS,
      })
    ).toEqual([]);
    expect(
      extractFileFilters({
        argv: ['viteval', 'run'],
        command: 'run',
        valueFlags: RUN_VALUE_FLAGS,
      })
    ).toEqual([]);
  });

  it('should not confuse filter names with the command token', () => {
    expect(
      extractFileFilters({
        argv: ['viteval', 'run', 'run.eval.ts'],
        command: 'run',
        valueFlags: RUN_VALUE_FLAGS,
      })
    ).toEqual(['run.eval.ts']);
  });
});

describe('createEvaluationDiscoveryPlugin', () => {
  it('should select collection-only scope without transforming user modules', () => {
    const plugin = createEvaluationDiscoveryPlugin();
    if (typeof plugin !== 'object' || plugin === null)
      throw new Error('expected a plugin object');
    expect(plugin.config?.({}, { command: 'serve', mode: 'test' })).toEqual({
      test: { provide: { vitevalDiscovery: true } },
    });
    expect(plugin.transform).toBeUndefined();
  });
});
