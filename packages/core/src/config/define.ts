import { defineConfig as defineVitestConfig } from 'vitest/config';
import type { VitevalConfig } from './types';

/**
 * Define the viteval config.
 *
 * @param config - The viteval config.
 * @returns The viteval config.
 */
export function defineConfig(config: VitevalConfig) {
  return defineVitestConfig({
    ...config,
    test: {
      ...config.eval,
      provide: {
        config,
      },
      environment: 'node',
      // We default to a very long timeout for evals since they can be slow
      testTimeout: config.eval?.timeout ?? 100000,
    },
    // @ts-expect-error - TODO: fix this
    plugins: config.plugins,
  });
}
