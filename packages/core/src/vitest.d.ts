import type { EvalResult } from '#/types'; // eslint-disable-line no-unused-vars -- used in module augmentation below
import type { SerializableVitevalConfig } from '#/plugin/viteval-plugin'; // eslint-disable-line no-unused-vars -- used in module augmentation below

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
