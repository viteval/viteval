import { aroundAll, inject } from 'vitest';
import { createProjectRuntime, setProjectRuntime } from './runtime';
import type { VitevalConfig } from './types';

declare module 'vitest' {
  interface ProvidedContext {
    vitevalConfigFile: string | undefined;
    vitevalProjectRoot: string;
  }
}

const configFile = inject('vitevalConfigFile'),
  loaded: { default: VitevalConfig } = configFile
    ? await import(/* @vite-ignore */ configFile)
    : { default: {} },
  runtime = createProjectRuntime({
    ...loaded.default,
    root: inject('vitevalProjectRoot'),
  });
setProjectRuntime(runtime);

// Registered first, this wraps evaluation persistence and all user cleanup hooks.
aroundAll(async (runSuite) => {
  try {
    await runSuite();
  } finally {
    try {
      await runtime.close();
    } finally {
      globalThis.__viteval_runtime = undefined;
    }
  }
});
