import { inject } from 'vitest';
import type { VitevalConfig } from '../config/types';

/**
 * Get the viteval config from the inject context.
 *
 * @returns The viteval config.
 */
export function getRuntimeConfig(): VitevalConfig {
  // @ts-expect-error - this is valid
  return inject('config') as VitevalConfig;
}
