import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { inject } from 'vitest';

/**
 * Instrument an evaluation subprocess and retain its worker coverage for merging.
 * @returns Native runner flags, or no flags for ordinary test runs.
 * @example spawnSync(CLI, ['run', ...createCoverageArguments()]);
 */
export function createCoverageArguments(): string[] {
  if (!inject('integrationCoverage')) return [];
  const id = randomUUID();
  const coverage = path.join(import.meta.dirname, 'coverage');
  return [
    '--coverage',
    '--coverage.allowExternal',
    '--coverage.reportOnFailure',
    '--coverage.exclude=**/node_modules/**',
    '--coverage.exclude=**/.test-*/**',
    '--coverage.exclude=**/*.test.*',
    '--coverage.excludeAfterRemap',
    '--coverage.reporter=json',
    `--coverage.reportsDirectory=${path.join(coverage, 'integration-runs', id)}`,
    '--reporter=default',
    '--reporter=blob',
    `--outputFile.blob=${path.join(coverage, 'integration-blobs', `${id}.json`)}`,
  ];
}
