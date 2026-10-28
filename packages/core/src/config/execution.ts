import { AsyncLocalStorage } from 'node:async_hooks';
import type { ProjectRuntime } from './runtime';

export interface DatasetDiscovery {
  register(value: unknown): void;
}

export interface ExecutionScope {
  readonly runtime?: ProjectRuntime;
  readonly discovery?: DatasetDiscovery;
}

interface ExecutionOwner {
  read(): ExecutionScope;
  include(scope: ExecutionScope): void;
}

// This transports dependencies; ownership and cleanup belong to each runner file.
const execution = new AsyncLocalStorage<() => ExecutionScope>();

/**
 * Begin a file's collection context before the engine creates deferred collectors.
 * @returns A file-owned scope updated only as its setup modules finish loading.
 * @example const owner = startExecution();
 * @internal
 */
export function startExecution(): ExecutionOwner {
  let scope: ExecutionScope = {};
  const owner = {
    read: () => scope,
    include(addition: ExecutionScope) {
      scope = { ...scope, ...addition };
    },
  };
  execution.enterWith(owner.read);
  return owner;
}

/** Read only the calling asynchronous execution's dependencies. @internal */
export function getExecutionScope(): ExecutionScope | undefined {
  return execution.getStore()?.();
}

/** Run a callback within explicitly owned dependencies. @internal */
export function runWithExecution<T>({
  scope,
  run,
}: {
  scope: ExecutionScope;
  run: () => T;
}): T {
  return execution.run(() => scope, run);
}

/** Preserve registration-time dependencies when the engine invokes a callback later. @internal */
export function bindExecution<ARGS extends unknown[], OUTPUT>(
  run: (...args: ARGS) => OUTPUT
): (...args: ARGS) => OUTPUT {
  const scope = getExecutionScope();
  return (...args) => {
    if (scope) {
      return runWithExecution({ scope, run: () => run(...args) });
    }
    return run(...args);
  };
}
