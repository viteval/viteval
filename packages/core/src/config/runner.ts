import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { ViteUserConfig } from 'vitest/config';
import type { VitevalConfig } from './types';

/**
 * Translate a Viteval config at the runner boundary, without exposing Vitest options.
 * @param options - Selected configuration file and project root.
 * @returns Internal Vite/Vitest overrides for the CLI.
 * @example createRunnerConfig({ configFile: '/app/viteval.config.ts', root: '/app' });
 * @internal
 */
export function createRunnerConfig(options: {
  configFile?: string;
  root: string;
}): ViteUserConfig {
  return {
    plugins: [
      {
        config(raw) {
          // Native runner configurations remain usable for integration tooling.
          if (options.configFile && !('__viteval' in raw)) return;
          const config = raw as ViteUserConfig & VitevalConfig;
          const root = path.resolve(options.root, config.root ?? '.');
          const setupFile = fileURLToPath(
            import.meta.resolve('@viteval/core/config/setup')
          );
          return {
            root,
            resolve: { tsconfigPaths: true },
            test: {
              include: config.eval?.include ?? ['**/*.eval.{ts,mts,js,mjs}'],
              exclude: config.eval?.exclude,
              testTimeout: config.eval?.timeout ?? 60_000,
              maxConcurrency: config.eval?.concurrency ?? 5,
              retry: config.eval?.retries ?? 0,
              setupFiles: [setupFile],
              provide: {
                vitevalConfigFile: options.configFile,
                vitevalProjectRoot: root,
              },
            },
          };
        },
        enforce: 'pre',
        name: 'viteval-config',
      },
    ],
  };
}
