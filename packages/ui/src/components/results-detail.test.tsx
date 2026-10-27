// @vitest-environment jsdom
import {
  cleanup,
  render,
  screen,
  within,
  act,
  fireEvent,
} from '@testing-library/react';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { afterEach, describe, expect, it } from 'vitest';
import type { EvalResults } from '@/types';
import { suiteId } from '@/lib/suite-id';
import { reportFixture } from '@/sdk/test-fixtures';
import ResultsDetail from './ResultsDetail';

afterEach(cleanup);

describe('ResultsDetail', () => {
  it('should expose provider execution diagnostics and leave cases with empty metadata unexpanded', async () => {
    const report = reportFixture({ id: 'diagnostic', index: 1 });
    const suite = report.evalResults[0];
    const evaluation = suite.evalResults[0];
    await renderResults({
      ...report,
      numTotalEvals: 2,
      numFailedEvals: 2,
      evalResults: [
        {
          ...suite,
          summary: {
            ...suite.summary,
            failedCount: undefined,
            skippedCount: undefined,
            totalCount: 2,
          },
          evalResults: [
            {
              ...evaluation,
              name: 'provider failure',
              scores: [],
              metadata: { executionError: 'Provider request failed' },
            },
            { ...evaluation, name: 'empty metadata', metadata: {} },
          ],
        },
      ],
    });
    fireEvent.click(screen.getByRole('button', { name: /provider failure/ }));
    expect(screen.getByRole('alert').textContent).toBe(
      'Provider request failed'
    );
    expect(screen.queryByRole('button', { name: /empty metadata/ })).toBeNull();
    expect(
      within(screen.getByRole('group', { name: 'Skipped' })).getByText('0')
    ).toBeTruthy();
  });
  it('should show skipped counts without misclassifying unexecuted cases as failures', async () => {
    const results: EvalResults = {
      schemaVersion: 1,
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
    await renderResults(results);
    expect(
      within(screen.getByRole('group', { name: 'Skipped' })).getByText('2')
    ).toBeTruthy();
    expect(
      within(screen.getByRole('group', { name: 'Failed' })).getByText('0')
    ).toBeTruthy();
  });
  it.each(['projects', 'outcomes', 'details', 'sorting'])(
    'should render project variants and final outcomes: %s',
    async (scenario) => {
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
            input: 'question',
            expected: 'answer',
            output: { text: 'answer' },
            metadata: { note: 'case context' },
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
            error: 'Execution hook failed',
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
      await renderResults(results);
      if (scenario === 'projects') {
        expect(
          screen.getByRole('heading', { name: 'accuracy [first]' })
        ).toBeTruthy();
        expect(
          screen.getByRole('heading', { name: 'accuracy [second]' })
        ).toBeTruthy();
        expect(screen.getByRole('alert').textContent).toContain(
          'Cleanup failed'
        );
        expect(
          decodeURIComponent(
            screen
              .getAllByRole('link', { name: 'View Eval' })[0]
              ?.getAttribute('href') ?? ''
          )
        ).toBe(`/suites/${suiteId({ ...base, projectName: 'first' })}`);
      }
      if (scenario === 'outcomes') {
        for (const row of screen.getAllByRole('button', { name: /sum-case/ }))
          expect(within(row).getByText('Passed')).toBeTruthy();
        for (const row of screen.getAllByRole('button', {
          name: /failed-case/,
        }))
          expect(within(row).getByText('Failed')).toBeTruthy();
      }
      if (scenario === 'details') {
        fireEvent.click(screen.getAllByText('sum-case')[0]);
        expect(screen.getByText('Input:')).toBeTruthy();
        expect(screen.getByText('Expected:')).toBeTruthy();
        expect(screen.getByText('Output:')).toBeTruthy();
        expect(screen.getByText('Metadata:')).toBeTruthy();
        expect(screen.getByText('Scores:')).toBeTruthy();
        fireEvent.click(screen.getAllByText('failed-case')[0]);
        expect(screen.getByText('Execution hook failed')).toBeTruthy();
      }
      if (scenario === 'sorting') {
        fireEvent.pointerDown(
          screen.getAllByRole('button', { name: 'Result' })[0],
          { button: 0, ctrlKey: false }
        );
        fireEvent.click(screen.getByRole('menuitem', { name: 'Asc' }));
        expect(
          screen.getAllByRole('button', { name: /sum-case|failed-case/ })[0]
            .textContent
        ).toContain('failed-case');
      }
    }
  );
});

async function renderResults(results: EvalResults) {
  const rootRoute = createRootRoute();
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/results/$id',
    component: () => <ResultsDetail results={results} />,
  });
  const suiteRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/suites/$slug',
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([detailRoute, suiteRoute]),
    history: createMemoryHistory({ initialEntries: ['/results/run'] }),
  });
  await act(async () => {
    await router.load();
    render(<RouterProvider router={router} />);
  });
}
