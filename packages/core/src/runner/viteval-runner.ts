import { type SerializedConfig, type TestContext, TestRunner } from 'vitest';
import { getEmbeddingModel, getModel } from '#/provider/client';

/**
 * Custom Vitest runner for viteval evaluations.
 *
 * Extends the built-in `VitestTestRunner` to add eval-specific lifecycle
 * hooks while preserving snapshot support and all default Vitest features.
 *
 * Responsibilities:
 * - Inject model references into test context via `extendTaskContext`
 *
 * @example
 * ```ts
 * // viteval.config.ts
 * import { defineConfig } from '@viteval/core/config';
 *
 * export default defineConfig({
 *   // runner is wired automatically
 * });
 * ```
 */
export default class VitevalRunner extends TestRunner {
	constructor(config: SerializedConfig) {
		super(config);
	}

	/**
	 * Extend the test context with model references.
	 *
	 * Since the runner executes in the same worker thread as tests,
	 * non-serializable AI SDK model instances can be passed directly.
	 *
	 * Note: Models are initialized via `initializeProvider()` which runs
	 * in `defineConfig`. At context-extension time, models may not yet be
	 * available in all scenarios. We use lazy getters so the values resolve
	 * when actually accessed during test execution.
	 *
	 * @param context - The base test context from Vitest.
	 * @returns The extended context with model accessors.
	 */
	override extendTaskContext(context: TestContext): TestContext {
		const extended = super.extendTaskContext(context);

		Object.defineProperty(extended, '__model', {
			configurable: true,
			enumerable: true,
			get: () => getModel(),
		});

		Object.defineProperty(extended, '__embeddingModel', {
			configurable: true,
			enumerable: true,
			get: () => getEmbeddingModel(),
		});

		return extended;
	}
}
