import { findUp } from 'find-up';
import { inject } from 'vitest';
import type { VitevalConfig } from './types';

/**
 * Get the viteval config from the inject context.
 *
 * @returns The viteval config.
 */
export function getRuntimeConfig(): VitevalConfig {
  // @ts-expect-error - this is valid
  return inject('config') as VitevalConfig;
}

/**
 * Find the viteval config file in the current working directory or a given root.
 *
 * @param root - The root directory to search for the config file.
 * @returns The path to the config file.
 */
export function findConfigFile(root: string) {
  return findUp(
    ['ts', 'js', 'mts', 'mjs'].map((ext) => `viteval.config.${ext}`),
    {
      cwd: root,
    }
  );
}
