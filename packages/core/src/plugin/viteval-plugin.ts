import type { Plugin } from 'vite';
import type { VitevalConfig } from '#/config/types';

/**
 * Serializable subset of `VitevalConfig` that can be provided to test
 * workers via Vitest's provide/inject mechanism.
 *
 * Non-serializable values (AI SDK model instances) are excluded because
 * they cannot cross the main-process / worker-thread boundary. Models are
 * injected into the worker via `globalThis` + the custom `VitevalRunner`.
 */
export interface SerializableVitevalConfig {
	eval?: VitevalConfig['eval'];
}

/**
 * Options accepted by the viteval Vite plugin factory.
 */
export interface VitevalPluginOptions {
	/**
	 * The full user-supplied viteval configuration.
	 */
	config: VitevalConfig;
}

/**
 * Create the viteval Vite plugin.
 *
 * The plugin uses Vitest's `configureVitest` hook to provide serializable
 * configuration data to test workers and to perform any post-resolution
 * adjustments.
 *
 * @param options - Plugin options containing the viteval config.
 * @returns A Vite plugin object.
 *
 * @example
 * ```ts
 * import { vitevalPlugin } from '@viteval/core/plugin';
 *
 * export default defineConfig({
 *   plugins: [vitevalPlugin({ config: myVitevalConfig })],
 * });
 * ```
 */
export function vitevalPlugin({ config }: VitevalPluginOptions): Plugin {
	const serializableConfig: SerializableVitevalConfig = {
		eval: config.eval,
	};

	return {
		configureVitest({ project }) {
			project.provide('config', serializableConfig);
		},
		name: 'viteval',
	};
}
