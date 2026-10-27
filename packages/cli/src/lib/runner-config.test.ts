import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
  access,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveConfig } from 'vitest/node';
import { createCliRunnerConfig } from './runner-config';

const cleanups: (() => void | Promise<void>)[] = [];

vi.mock('node:fs', async (importOriginal) => {
  const fs = await importOriginal<typeof import('node:fs')>();
  return { ...fs, writeFileSync: vi.fn(fs.writeFileSync) };
});

afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

describe('createCliRunnerConfig', () => {
  it('should resolve package imports from the original installed consumer project', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'viteval-installed-')),
      original = path.join(directory, 'viteval.config.ts');
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
    await writeFile(
      original,
      "import { defineConfig } from 'viteval/config'; export default defineConfig({ eval: { timeout: 1234 } });"
    );
    const runner = createCliRunnerConfig({
      configFile: original,
      root: directory,
    });
    cleanups.push(runner.cleanup);
    const resolved = await resolveConfig({
      config: runner.configFile,
      root: directory,
    });
    expect(resolved.test.testTimeout).toBe(1234);
    expect(resolved.test.provide.vitevalProjectRoot).toBe(directory);
  });
  it('should clean up on native CLI process exit', async () => {
    const moduleUrl = new URL('./runner-config.ts', import.meta.url).href,
      child = spawnSync(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          `
        import { createCliRunnerConfig } from ${JSON.stringify(moduleUrl)};
        console.log(createCliRunnerConfig({ root: process.cwd() }).configFile);
      `,
        ],
        { encoding: 'utf8' }
      );
    expect(child.status, child.stderr).toBe(0);
    await expect(access(child.stdout.trim())).rejects.toThrow();
  });
  it('should remove its temporary directory when writing the wrapper fails', async () => {
    let directory = '';
    const listeners = process.listenerCount('exit');
    vi.mocked(writeFileSync).mockImplementationOnce((file) => {
      directory = path.dirname(String(file));
      throw new Error('disk full');
    });
    expect(() => createCliRunnerConfig({ root: process.cwd() })).toThrow(
      'disk full'
    );
    expect(process.listenerCount('exit')).toBe(listeners);
    expect(directory).not.toBe('');
    await expect(access(directory)).rejects.toThrow();
  });
  it('should create a default config and remove its directory idempotently', async () => {
    const listeners = process.listenerCount('exit'),
      runner = createCliRunnerConfig({ root: process.cwd() });
    cleanups.push(runner.cleanup);
    expect(process.listenerCount('exit')).toBe(listeners + 1);
    const source = await readFile(runner.configFile, 'utf8');
    expect(source).toContain('const original = {};');
    expect(source).toContain('createRunnerConfig');
    runner.cleanup();
    runner.cleanup();
    expect(process.listenerCount('exit')).toBe(listeners);
    await expect(access(path.dirname(runner.configFile))).rejects.toThrow();
  });

  it.each(['object', 'function', 'promise'])(
    'should load native %s configs from URL-safe paths without replacing their options',
    async (kind) => {
      const directory = await mkdtemp(
          path.join(tmpdir(), 'viteval native %# ')
        ),
        original = path.join(directory, 'original %#.mjs'),
        config = `{ root: ${JSON.stringify(directory)}, test: { include: ['native.test.ts'], testTimeout: 321 } }`;
      cleanups.push(() => rm(directory, { recursive: true, force: true }));
      const exports = {
        object: config,
        function: `async (env) => { if (env.mode !== 'test') throw new Error('wrong environment'); return ${config}; }`,
        promise: `Promise.resolve(${config})`,
      };
      await writeFile(
        original,
        `export default ${exports[kind as keyof typeof exports]};`
      );
      const runner = createCliRunnerConfig({
        configFile: original,
        root: directory,
      });
      cleanups.push(runner.cleanup);
      const resolved = await resolveConfig({ config: runner.configFile });
      expect(resolved.root).toBe(await realpath(directory));
      expect(resolved.test.include).toEqual(['native.test.ts']);
      expect(resolved.test.testTimeout).toBe(321);
    }
  );
});
