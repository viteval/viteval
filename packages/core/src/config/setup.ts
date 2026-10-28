import { aroundAll, inject } from 'vitest';
import { createProjectRuntime } from './runtime';
import { getExecutionScope, runWithExecution } from './execution';
import type { EvalOptions, VitevalConfig } from './types';

declare module 'vitest' {
  interface ProvidedContext {
    vitevalConfigFile: string | undefined;
    vitevalProjectRoot: string;
    vitevalDiscovery: boolean | undefined;
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
export const executionScope = {
  ...getExecutionScope(),
  runtime,
  ...(inject('vitevalDiscovery') && { discovery: { register() {} } }),
};

// Registered first, this wraps evaluation persistence and all user cleanup hooks.
aroundAll(async (runSuite) => {
  try {
    await runWithExecution({ scope: { runtime }, run: runSuite });
  } finally {
    await runtime.close();
  }
});
