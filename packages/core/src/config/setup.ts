import { aroundAll, inject } from 'vitest';
import {
  closeProjectRuntime,
  createProjectRuntime,
  setProjectRuntime,
} from './runtime';
import type { EvalOptions, VitevalConfig } from './types';

declare module 'vitest' {
  interface ProvidedContext {
    vitevalConfigFile: string | undefined;
    vitevalProjectRoot: string;
    vitevalEvalDefaults: Pick<
      EvalOptions,
      'timeout' | 'concurrency' | 'retries'
    >;
  }
}

const configFile = inject('vitevalConfigFile'),
  loaded: { default: VitevalConfig } = configFile
    ? await import(/* @vite-ignore */ configFile)
    : { default: {} },
  runtime = createProjectRuntime({
    ...loaded.default,
    eval: {
      ...loaded.default.eval,
      ...inject('vitevalEvalDefaults'),
    },
    root: inject('vitevalProjectRoot'),
  });
setProjectRuntime(runtime);

// Registered first, this wraps evaluation persistence and all user cleanup hooks.
aroundAll(async (runSuite) => {
  try {
    await runSuite();
  } finally {
    await closeProjectRuntime();
  }
});
