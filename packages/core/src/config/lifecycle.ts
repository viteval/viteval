import { TestRunner } from 'vitest';
import type { RunnerTestFile } from 'vitest';
import { closeProjectRuntime } from './runtime';

/** File-boundary cleanup also runs when Vitest skips suite hooks. @internal */
export default class VitevalLifecycleRunner extends TestRunner {
  override async onAfterRunFiles(files: RunnerTestFile[]): Promise<void> {
    try {
      super.onAfterRunFiles(files);
    } finally {
      await closeProjectRuntime();
    }
  }
}
