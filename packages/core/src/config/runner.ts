import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { configDefaults, type ViteUserConfig } from 'vitest/config';
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
          const root = path.resolve(
            options.root,
            config.test?.root ?? config.root ?? '.'
          );
          const retry = config.test?.retry ?? config.eval?.retries ?? 0;
          const timeout =
            config.test?.testTimeout ?? config.eval?.timeout ?? 60_000;
          const defaults = {
            // Native zero disables timeouts; leave case timeouts inherited in workers.
            timeout: config.test?.testTimeout === 0 ? undefined : timeout,
            concurrency:
              config.test?.maxConcurrency ?? config.eval?.concurrency ?? 5,
            retries: typeof retry === 'number' ? retry : (retry.count ?? 0),
          };
          const setupFile = fileURLToPath(
            import.meta.resolve('@viteval/core/config/setup')
          );
          return {
            root,
            resolve: { tsconfigPaths: true },
            test: {
              root,
              include: config.eval?.include ?? ['**/*.eval.{ts,mts,js,mjs}'],
              exclude: [
                ...new Set([
                  ...configDefaults.exclude,
                  ...(config.eval?.exclude ?? []),
                ]),
              ],
              testTimeout: timeout,
              maxConcurrency: defaults.concurrency,
              retry,
              runner: path.join(path.dirname(setupFile), 'lifecycle.mjs'),
              setupFiles: [setupFile],
              provide: {
                vitevalConfigFile: options.configFile,
                vitevalProjectRoot: root,
                vitevalEvalDefaults: defaults,
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
