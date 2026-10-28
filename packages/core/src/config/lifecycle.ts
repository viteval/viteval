import { attempt, isErr } from 'massaman/control';
import { TestRunner } from 'vitest';
import type { RunnerTestFile } from 'vitest';

import { startExecution } from './execution';
import type { ExecutionScope } from './execution';

/** File-boundary cleanup also runs when Vitest skips suite hooks. @internal */
export default class VitevalLifecycleRunner extends TestRunner {
  private readonly executions = new Set<ReturnType<typeof startExecution>>();

  override async importFile(
    filepath: string,
    source: 'setup' | 'collect'
  ): Promise<unknown> {
    // Vitest dispatches onCollectStart asynchronously without awaiting it.
    // Enter collection ownership synchronously at the first ordered setup import.
    if (source === 'setup' && filepath === this.config.setupFiles[0]) {
      this.executions.add(startExecution());
    }
    const owner = [...this.executions].at(-1);
    const imported: unknown = await super.importFile(filepath, source);
    if (
      source === 'setup' &&
      typeof imported === 'object' &&
      imported !== null &&
      'executionScope' in imported
    ) {
      owner?.include(imported.executionScope as ExecutionScope);
    }
    return imported;
  }

  override async onAfterRunFiles(files: RunnerTestFile[]): Promise<void> {
    const engineCleanup = attempt(() => super.onAfterRunFiles(files));
    const results = await Promise.allSettled(
      [...this.executions].map((owner) => owner.read().runtime?.close())
    );
    this.executions.clear();
    const failures = [
      ...[engineCleanup].filter(isErr).map((result) => result.error),
      ...results
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason),
    ];
    if (failures.length === 1) {
      throw failures[0];
    }
    if (failures.length > 1) {
      throw new AggregateError(
        failures,
        'Failed to close Viteval execution scopes'
      );
    }
  }
}
