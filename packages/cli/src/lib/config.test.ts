import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveProjectConfig } from './config';

const directories: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('resolveProjectConfig', () => {
  it('should use the current directory when no root or config is provided', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'viteval-config-'));
    directories.push(directory);
    vi.spyOn(process, 'cwd').mockReturnValue(directory);
    expect(resolveProjectConfig({})).toEqual({
      root: process.cwd(),
      configFile: undefined,
    });
  });

  it('should disable discovery for an explicit false config', () => {
    expect(resolveProjectConfig({ config: false, root: './project' })).toEqual({
      root: path.resolve('project'),
      configFile: undefined,
    });
  });

  it('should resolve explicit configs relative to the explicit root', () => {
    expect(
      resolveProjectConfig({ config: 'config/evals.ts', root: './project' })
    ).toEqual({
      root: path.resolve('project'),
      configFile: path.resolve('project/config/evals.ts'),
    });
  });

  it('should use the config directory as the implicit project root', () => {
    expect(resolveProjectConfig({ config: './project/evals.ts' })).toEqual({
      root: path.resolve('project'),
      configFile: path.resolve('project/evals.ts'),
    });
  });

  it.each(['ts', 'mts', 'js', 'mjs', 'cts', 'cjs'])(
    'should discover .%s configs and prefer Viteval over native Vitest',
    async (extension) => {
      const root = await mkdtemp(path.join(tmpdir(), 'viteval-config-'));
      directories.push(root);
      const native = path.join(root, `vitest.config.${extension}`),
        own = path.join(root, `viteval.config.${extension}`);
      await writeFile(native, 'export default {};');
      expect(resolveProjectConfig({ root })).toEqual({
        root,
        configFile: native,
      });
      await writeFile(own, 'export default {};');
      expect(resolveProjectConfig({ root })).toEqual({ root, configFile: own });
    }
  );
});
