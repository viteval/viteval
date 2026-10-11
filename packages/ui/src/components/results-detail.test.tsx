// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { EvalResults } from '@/types';
import ResultsDetail from './ResultsDetail';

afterEach(cleanup);

describe('ResultsDetail', () => {
  it('should show skipped counts without misclassifying unexecuted cases as failures', () => {
    const results: EvalResults = {
      runId: 'skipped',
      runName: 'skipped',
      status: 'finished',
      success: true,
      numTotalEvalSuites: 1,
      numPassedEvalSuites: 1,
      numFailedEvalSuites: 0,
      numTotalEvals: 2,
      numPassedEvals: 0,
      numFailedEvals: 0,
      numSkippedEvals: 2,
      startTime: 1,
      evalResults: [
        {
          name: 'skipped suite',
          filepath: 'skipped.eval.ts',
          status: 'passed',
          startTime: 1,
          endTime: 2,
          duration: 1,
          summary: {
            meanScore: 0,
            medianScore: 0,
            sumScore: 0,
            passedCount: 0,
            totalCount: 2,
            skippedCount: 2,
          },
          evalResults: [],
        },
      ],
    };
    render(<ResultsDetail results={results} />);
    expect(
      within(screen.getByRole('group', { name: 'Skipped' })).getByText('2')
    ).toBeTruthy();
    expect(
      within(screen.getByRole('group', { name: 'Failed' })).getByText('0')
    ).toBeTruthy();
  });
  it('should render project variants and final outcomes instead of gating on mean', () => {
    const base = {
      name: 'accuracy',
      filepath: 'accuracy.eval.ts',
      status: 'failed' as const,
      startTime: 1,
      endTime: 2,
      duration: 1,
      summary: {
        meanScore: 0.75,
        medianScore: 0.75,
        sumScore: 2,
        passedCount: 1,
        totalCount: 2,
        failedCount: 1,
        skippedCount: 0,
      },
      evalResults: [
        {
          id: 'sum-case',
          name: 'sum-case',
          aggregation: 'sum' as const,
          threshold: 1,
          mean: 0.5,
          median: 0.5,
          sum: 1,
          scores: [
            { name: 'first', score: 0.5 },
            { name: 'second', score: 0.5 },
          ],
          state: 'passed' as const,
        },
        {
          id: 'failed-case',
          name: 'failed-case',
          aggregation: 'mean' as const,
          threshold: 0.5,
          mean: 1,
          median: 1,
          sum: 1,
          scores: [{ name: 'exact', score: 1 }],
          state: 'failed' as const,
        },
      ],
    };
    const results: EvalResults = {
      schemaVersion: 1,
      runId: 'run',
      runName: 'run',
      status: 'finished',
      success: false,
      numTotalEvalSuites: 2,
      numPassedEvalSuites: 0,
      numFailedEvalSuites: 2,
      numTotalEvals: 4,
      numPassedEvals: 2,
      numFailedEvals: 2,
      numSkippedEvals: 0,
      startTime: 1,
      endTime: 2,
      duration: 1,
      evalResults: [
        { ...base, projectName: 'first', message: 'Cleanup failed' },
        { ...base, projectName: 'second' },
      ],
    };
    render(<ResultsDetail results={results} />);
    expect(
      screen.getByRole('heading', { name: 'accuracy [first]' })
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'accuracy [second]' })
    ).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Cleanup failed');
    for (const row of screen.getAllByRole('row', { name: /sum-case/ }))
      expect(within(row).getByText('Passed')).toBeTruthy();
    for (const row of screen.getAllByRole('row', { name: /failed-case/ }))
      expect(within(row).getByText('Failed')).toBeTruthy();
  });
});
