import type { EvalResult } from '#/types';
import type { SerializableVitevalConfig } from '#/plugin/viteval-plugin';

declare module '@vitest/runner' {
	interface TaskMeta {
		evalResult?: EvalResult;
	}
}

declare module 'vitest' {
	interface ProvidedContext {
		config: SerializableVitevalConfig;
	}
}
