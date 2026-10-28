import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveConfig } from 'vitest/node';
import { defineConfig } from './index';
import { createRunnerConfig } from './runner';

const ROOT = path.resolve(import.meta.dirname, '../../../..');

describe('createRunnerConfig', () => {
  it('should apply framework defaults without loading project clients', async () => {
    const config = await resolveConfig(
      { config: false },
      createRunnerConfig({ root: ROOT })
    );
    expect(config.root).toBe(ROOT);
    expect(config.test).toMatchObject({
      root: ROOT,
      include: ['**/*.eval.{ts,mts,js,mjs}'],
      exclude: ['**/node_modules/**', '**/.git/**'],
      testTimeout: 60_000,
      maxConcurrency: 5,
      retry: 0,
      provide: {
        vitevalProjectRoot: ROOT,
        vitevalEvalDefaults: { timeout: 60_000, concurrency: 5, retries: 0 },
      },
    });
    expect(config.test.setupFiles).toHaveLength(1);
    expect(config.test.setupFiles[0]).toContain('/config/setup');
    expect(config.test.runner).toContain('/config/lifecycle');
  });

  it('should resolve project root consistently for discovery and workers', async () => {
    const config = await resolveConfig(
      { config: false },
      {
        ...createRunnerConfig({ root: ROOT }),
        ...defineConfig({
          root: './packages/core',
          eval: { timeout: 1234, concurrency: 2, retries: 3 },
        }),
      }
    );
    expect(config.root).toBe(path.join(ROOT, 'packages/core'));
    expect(config.test.root).toBe(config.root);
    expect(config.test.provide).toMatchObject({
      vitevalProjectRoot: config.root,
      vitevalEvalDefaults: { timeout: 1234, concurrency: 2, retries: 3 },
    });
  });

  it('should prioritize explicit CLI roots and worker defaults over project options', async () => {
    const config = await resolveConfig(
      {
        config: false,
        root: path.join(ROOT, 'packages/cli'),
        testTimeout: 4321,
        maxConcurrency: 7,
        retry: 0,
      },
      {
        ...createRunnerConfig({ root: ROOT }),
        ...defineConfig({
          root: './packages/core',
          eval: { timeout: 1234, concurrency: 2, retries: 3 },
        }),
      }
    );
    expect(config.root).toBe(path.join(ROOT, 'packages/cli'));
    expect(config.test.root).toBe(config.root);
    expect(config.test).toMatchObject({
      testTimeout: 4321,
      maxConcurrency: 7,
      retry: 0,
      provide: {
        vitevalProjectRoot: config.root,
        vitevalEvalDefaults: { timeout: 4321, concurrency: 7, retries: 0 },
      },
    });
  });

  it.each([{ count: 2, delay: 5 }, {}])(
    'should preserve native retry policies and provide their effective count: %j',
    async (retry) => {
      const config = await resolveConfig(
        { config: false, retry },
        createRunnerConfig({ root: ROOT })
      );
      expect(config.test.retry).toEqual(retry);
      expect(config.test.provide.vitevalEvalDefaults).toMatchObject({
        retries: 'count' in retry ? retry.count : 0,
      });
    }
  );

  it('should preserve native zero as an explicitly disabled timeout', async () => {
    const config = await resolveConfig(
      { config: false, testTimeout: 0 },
      {
        ...createRunnerConfig({ root: ROOT }),
        ...defineConfig({ eval: { timeout: 1 } }),
      }
    );
    expect(config.test.testTimeout).toBe(0);
    expect(config.test.provide.vitevalEvalDefaults).toMatchObject({
      timeout: undefined,
    });
  });

  it('should append mandatory exclusions to custom eval patterns', async () => {
    const config = await resolveConfig(
      { config: false },
      {
        ...createRunnerConfig({ root: ROOT }),
        ...defineConfig({
          eval: {
            include: ['src/**/*.eval.ts'],
            exclude: ['**/fixtures/**', '**/node_modules/**'],
          },
        }),
      }
    );
    expect(config.test.include).toEqual(['src/**/*.eval.ts']);
    expect(config.test.exclude).toEqual([
      '**/node_modules/**',
      '**/.git/**',
      '**/fixtures/**',
    ]);
  });

  it('should reject explicitly selected native configurations', async () => {
    await expect(
      resolveConfig(
        { config: false },
        {
          ...createRunnerConfig({
            configFile: '/native/config.ts',
            root: ROOT,
          }),
          root: ROOT,
          test: { include: ['**/*.test.ts'], testTimeout: 450 },
        }
      )
    ).rejects.toThrow('Expected a Viteval configuration');
  });

  it('should adapt explicitly selected Viteval configurations', async () => {
    const config = await resolveConfig(
      { config: false },
      {
        ...createRunnerConfig({ configFile: '/app/config.ts', root: ROOT }),
        ...defineConfig({}),
      }
    );
    expect(config.test.provide).toMatchObject({
      vitevalConfigFile: '/app/config.ts',
    });
  });
});
