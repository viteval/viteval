import { P, match } from 'ts-pattern';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import type { VitevalConfig } from './types';

/**
 * Define the viteval config.
 *
 * @param config - The viteval config.
 * @returns The viteval config.
 */
export function defineConfig({
  eval: evalConfig,
  plugins,
  resolve,
  reporters,
  deps,
  server,
  ...config
}: VitevalConfig) {
  return defineVitestConfig({
    ...config,
    test: {
      ...evalConfig,
      reporters,
      // eslint-disable-next-line no-explicit-any -- Vitest 4.x changed server types
      server: server as any,
      provide: {
        config,
      },
      environment: 'node',
      // We default to a very long timeout for evals since they can be slow
      testTimeout: evalConfig?.timeout ?? 100_000,
      deps: match(deps)
        .with(P.not(P.nullish), (o) => ({
          optimizer: match(o.optimizer)
            .with(P.not(P.nullish), (o) => ({ ssr: o, web: o }))
            .otherwise(() => undefined),
          interopDefault: o.interopDefault,
        }))
        .otherwise(() => undefined),
    },
    resolve,
    // eslint-disable-next-line no-explicit-any -- Vitest plugin types mismatch
    plugins: plugins as any,
  });
}
