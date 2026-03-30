import { viteval } from '@viteval/providers';
import { defineConfig as coreDefineConfig } from '@viteval/core/config';
import type { VitevalConfig } from '@viteval/core/config';

/**
 * Define the viteval config.
 *
 * Automatically uses the native SQLite provider if no provider is specified.
 *
 * @param config - The viteval config.
 * @returns The viteval config.
 */
export function defineConfig(
  config: VitevalConfig
): ReturnType<typeof coreDefineConfig> {
  return coreDefineConfig({
    ...config,
    provider: config.provider ?? viteval(),
  });
}
