import type { VitevalConfig } from '../config/types';

/**
 * Get the viteval config from the inject context.
 *
 * @returns The viteval config.
 */
export function getRuntimeConfig(): VitevalConfig {
  if (!import.meta.vitest) {
    throw new Error('vitest is not available');
  }

  // @ts-expect-error - this is valid
  return import.meta.vitest.inject('config') as VitevalConfig;
}
