import { inject } from 'vitest';
import type { VitevalConfig } from './types';

/**
 * Get the viteval config from the inject context.
 *
 * @returns The viteval config.
 */
export function getConfig(): VitevalConfig {
  // @ts-expect-error - this is valid
  return inject('config') as VitevalConfig;
}
