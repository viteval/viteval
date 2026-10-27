import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { EvalResults } from '@/types';

/**
 * Creates independent persisted run fixtures for dashboard regressions.
 * @param params - Run ID, ordering, outcome, and optional suite identities.
 * @returns A valid evaluation report.
 * @example reportFixture({ id: 'run', index: 1 });
 */
export function reportFixture({
  id,
  index = 0,
  suites = [
    {
      name: `Eval ${String(index).padStart(2, '0')}`,
      filepath: 'src/accuracy.eval.ts',
    },
  ],
}: {
  id: string;
  index?: number;
  suites?: { name: string; projectName?: string; filepath?: string }[];
}): EvalResults {
  const success = index % 2 === 0;
  const startTime = Date.UTC(2026, 9, 1) + index * 1_000;
  return {
    schemaVersion: 1,
    runId: id,
    runName: `Run ${String(index).padStart(2, '0')}`,
    status: index === 24 ? 'running' : 'finished',
    success,
    startTime,
    endTime: startTime + index,
    duration: index,
    numTotalEvalSuites: suites.length,
    numPassedEvalSuites: success ? suites.length : 0,
    numFailedEvalSuites: success ? 0 : suites.length,
    numTotalEvals: suites.length,
    numPassedEvals: success ? suites.length : 0,
    numFailedEvals: success ? 0 : suites.length,
    numSkippedEvals: 0,
    evalResults: suites.map((suite) => ({
      ...suite,
      filepath: suite.filepath ?? '',
      status: success ? 'passed' : 'failed',
      startTime,
      endTime: startTime + index,
      duration: index,
      summary: {
        meanScore: success ? 1 : 0,
        medianScore: success ? 1 : 0,
        sumScore: success ? 1 : 0,
        passedCount: success ? 1 : 0,
        failedCount: success ? 0 : 1,
        skippedCount: 0,
        totalCount: 1,
      },
      evalResults: [
        {
          id: `${id}:${suite.name}`,
          name: 'accuracy case',
          state: success ? 'passed' : 'failed',
          aggregation: 'mean',
          threshold: 0.5,
          mean: success ? 1 : 0,
          median: success ? 1 : 0,
          sum: success ? 1 : 0,
          scores: [{ name: 'accuracy', score: success ? 1 : 0 }],
        },
      ],
    })),
  };
}

/**
 * Writes more than one server page of runs, datasets, and suites.
 * @param root - Isolated project directory.
 * @returns Resolves after all fixtures have been written.
 * @example await writeListingFixtures(root);
 */
export async function writeListingFixtures(root: string) {
  await mkdir(path.join(root, '.viteval/results'), { recursive: true });
  await mkdir(path.join(root, '.viteval/datasets'), { recursive: true });
  for (let index = 0; index < 25; index++) {
    await writeFile(
      path.join(root, '.viteval/results', `run-${index}.json`),
      JSON.stringify(reportFixture({ id: `run-${index}`, index }))
    );
    await writeFile(
      path.join(root, '.viteval/datasets', `dataset-${index}.json`),
      JSON.stringify({
        schemaVersion: 1,
        id: `dataset-${index}`,
        name: `Dataset ${String(index).padStart(2, '0')}`,
        version: 1,
        metadata: {},
        description: index === 24 ? 'unique remote description' : undefined,
        createdAt: new Date(Date.UTC(2026, 9, 1) + index * 1_000).toISOString(),
        updatedAt: new Date(Date.UTC(2026, 9, 1) + index * 1_000).toISOString(),
        data: Array.from({ length: index + 1 }, () => ({
          input: index,
          expected: null,
        })),
      })
    );
  }
}
