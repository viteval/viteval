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
  ...config
}: VitevalConfig) {
  return defineVitestConfig({
    ...config,
    test: {
      ...evalConfig,
      provide: {
        config,
      },
      environment: 'node',
      // We default to a very long timeout for evals since they can be slow
      testTimeout: evalConfig?.timeout ?? 100000,
    },
    resolve,
    // @ts-expect-error - TODO: fix this
    plugins,
  });
}
