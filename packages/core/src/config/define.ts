import { match, P } from 'ts-pattern';
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
  deps,
  server,
  ...config
}: VitevalConfig) {
  return defineVitestConfig({
    ...config,
    test: {
      ...evalConfig,
      server,
      provide: {
        config,
      },
      environment: 'node',
      // We default to a very long timeout for evals since they can be slow
      testTimeout: evalConfig?.timeout ?? 100000,
      deps: match(deps)
        .with(P.not(P.nullish), (o) => {
          return {
            optimizer: match(o.optimizer)
              .with(P.not(P.nullish), (o) => ({ ssr: o, web: o }))
              .otherwise(() => undefined),
            interopDefault: o.interopDefault,
          };
        })
        .otherwise(() => undefined),
    },
    resolve,
    // @ts-expect-error - TODO: fix this
    plugins,
  });
}
