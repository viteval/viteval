import { match, P } from 'ts-pattern';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import { initializeProvider } from '#/provider/initialize';
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
  provider,
  ...config
}: VitevalConfig) {
  // Initialize the provider eagerly — AI SDK model instances are not
  // serializable so they cannot go through Vitest's provide/inject.
  if (provider) {
    initializeProvider(provider);
  }

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
    // eslint-disable-next-line no-explicit-any -- Vitest plugin types mismatch
    plugins: plugins as any,
  });
}
