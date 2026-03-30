import { dirname, resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { P, match } from 'ts-pattern';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import { vitevalPlugin } from '#/plugin/viteval-plugin';
import { initializeProvider } from '#/provider/initialize';
import type { VitevalConfig } from './types';

const RUNNER_PATH = pathResolve(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'runner',
	'index.mjs'
);

/**
 * Define the viteval config.
 *
 * Composes the viteval Vite plugin, the custom runner, and user-supplied
 * options into a fully resolved Vitest configuration.
 *
 * @param config - The viteval config.
 * @returns The resolved Vitest config.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@viteval/core/config';
 * import { openai } from '@ai-sdk/openai';
 *
 * export default defineConfig({
 *   provider: { model: openai('gpt-4o-mini') },
 *   eval: { include: ['**\/*.eval.ts'] },
 * });
 * ```
 */
export function defineConfig(config: VitevalConfig) {
	const {
		eval: evalConfig,
		plugins = [],
		resolve,
		reporters,
		deps,
		server,
		provider,
	} = config;

	// Initialize the provider eagerly — AI SDK model instances are not
	// Serializable so they cannot go through Vitest's provide/inject.
	// The custom VitevalRunner reads them from globalThis via lazy getters.
	if (provider) {
		initializeProvider(provider);
	}

	return defineVitestConfig({
		plugins: [vitevalPlugin({ config }), ...plugins],
		resolve,
		test: {
			...evalConfig,
			deps: match(deps)
				.with(P.not(P.nullish), (o) => ({
					interopDefault: o.interopDefault,
					optimizer: match(o.optimizer)
						.with(P.not(P.nullish), (o) => ({ ssr: o, web: o }))
						.otherwise(() => undefined),
				}))
				.otherwise(() => undefined),
			environment: 'node',
			reporters,
			runner: RUNNER_PATH,
			server,
			testTimeout: evalConfig?.timeout ?? 100_000,
		},
	});
}
