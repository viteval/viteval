import { isErr } from 'massaman/control';
import { getProjectRuntime } from '#/config/runtime';
import type { ResultProviderName } from './registry';
import type { EvalProvider } from './types';
import { getEvalProvider } from './client';

/**
 * Resolve selected result destinations before evaluation tasks execute.
 * @param names - Replaces the configured result destinations when supplied.
 * @returns Initialized evaluation writers, in selection order.
 * @example const writers = await getResultDestinations(['json']);
 * @internal
 */
export async function getResultDestinations(
  names?: readonly ResultProviderName[]
): Promise<EvalProvider[]> {
  const runtime = getProjectRuntime();
  if (!runtime) {
    if (names?.length) {
      throw new Error(
        'Result destinations require a Viteval project configuration'
      );
    }
    const legacy = getEvalProvider();
    return names ? [] : legacy ? [legacy] : [];
  }
  return Promise.all(
    runtime.resultNames(names).map(async (name) => {
      const provider = await runtime.provider(name);
      if (!provider.evals) {
        throw new Error(
          `Provider "${name}" does not support evaluation results`
        );
      }
      return provider.evals;
    })
  );
}

/**
 * Attempt every destination operation and surface partial failures together.
 * @param operations - Independent writes of the same evaluation outcomes.
 * @returns Completed values, or an aggregate destination error.
 * @example await writeDestinations(writers.map((writer) => () => writer.complete(params)));
 * @internal
 */
export async function writeDestinations<T>(
  operations: readonly (() => Promise<import('massaman/control').Result<T>>)[]
): Promise<T[]> {
  const results = await Promise.allSettled(
      operations.map(async (operation) => {
        const result = await operation();
        if (isErr(result)) {
          throw result.error;
        }
        return result.value;
      })
    ),
    failures = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason);
  if (failures.length) {
    throw new AggregateError(
      failures,
      `Result persistence failed: ${failures.map((failure) => (failure instanceof Error ? failure.message : String(failure))).join('; ')}`
    );
  }
  return results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);
}
