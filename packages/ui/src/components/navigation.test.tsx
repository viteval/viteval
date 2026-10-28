// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DatasetsList } from './datasets-list';
import { ListFilter } from './list-filter';
import { ResultsTable } from './results-table';
import { ResultsList } from './results-list';
import { SuitesList } from './suites-list';
import { suiteId } from '@/lib/suite-id';
import type { ResultFile } from '@/types';

const scrollIntoView = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollIntoView'
);
beforeEach(() =>
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
);
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  if (scrollIntoView)
    Object.defineProperty(
      HTMLElement.prototype,
      'scrollIntoView',
      scrollIntoView
    );
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
});

describe('component navigation', () => {
  it.each([
    ['status=passed', ['Passed run', 'Running run']],
    ['status=failed', ['Failed run']],
    ['status=running', ['Running run']],
    ['status=unknown', ['Passed run', 'Failed run', 'Running run']],
    ['from=2026-10-02&to=2026-10-02', ['Failed run']],
    ['to=2026-10-02', ['Passed run', 'Failed run', 'Missing summary']],
    ['', ['Passed run', 'Failed run', 'Running run', 'Missing summary']],
    [
      'from=invalid&to=invalid',
      ['Passed run', 'Failed run', 'Running run', 'Missing summary'],
    ],
  ] as const)('should filter local results with %s', async (query, names) => {
    stubTags();
    const results: ResultFile[] = [
      'Passed run',
      'Failed run',
      'Running run',
    ].map((name, index) => ({
      id: `run-${index}`,
      runId: `run-${index}`,
      name,
      path: '',
      size: 1,
      summary: {
        status: index === 2 ? 'running' : 'finished',
        success: index !== 1,
        numTotalEvalSuites: 1,
        numPassedEvalSuites: index === 1 ? 0 : 1,
        numFailedEvalSuites: index === 1 ? 1 : 0,
        numTotalEvals: 1,
        numPassedEvals: index === 1 ? 0 : 1,
        numFailedEvals: index === 1 ? 1 : 0,
        duration: 0,
        startTime: Date.UTC(2026, 9, index + 1),
        endTime: 0,
        suiteNames: [],
        suiteIds: [],
      },
    }));
    results.push({
      id: 'missing',
      runId: 'missing',
      name: 'Missing summary',
      path: '',
      size: 0,
      summary: null,
    });
    await renderNavigation({
      component: <ResultsList results={results} />,
      initialEntry: `/results?${query}`,
    });
    for (const name of [
      'Passed run',
      'Failed run',
      'Running run',
      'Missing summary',
    ]) {
      expect(Boolean(screen.queryByText(name))).toBe(
        names.some((expected) => expected === name)
      );
    }
  });

  it.each(['Status', 'Duration', 'Passed', 'Failed', 'Total'])(
    'should sort local results by %s in both directions',
    async (name) => {
      stubTags();
      await renderNavigation({
        component: (
          <ResultsList
            results={[1, 2].map((value) => ({
              id: `sort-${value}`,
              runId: `sort-${value}`,
              name: `Run ${value}`,
              path: '',
              size: 1,
              summary: {
                status: 'finished',
                success: value === 1,
                numTotalEvalSuites: value,
                numPassedEvalSuites: value,
                numFailedEvalSuites: 0,
                numTotalEvals: value,
                numPassedEvals: value,
                numFailedEvals: value - 1,
                duration: value,
                startTime: value,
                endTime: value,
                suiteNames: [],
                suiteIds: [],
              },
            }))}
          />
        ),
        initialEntry: '/results',
      });
      fireEvent.pointerDown(screen.getByRole('button', { name }), {
        button: 0,
        ctrlKey: false,
      });
      fireEvent.click(screen.getByRole('menuitem', { name: 'Asc' }));
      fireEvent.pointerDown(screen.getByRole('button', { name }), {
        button: 0,
        ctrlKey: false,
      });
      fireEvent.click(screen.getByRole('menuitem', { name: 'Desc' }));
    }
  );

  it.each([
    ['q=alpha', ['Alpha']],
    ['q=accuracy', ['Beta']],
    ['status=failed', ['Beta']],
    ['q=absent', []],
    ['', ['Alpha', 'Beta', 'Gamma']],
  ])(
    'should filter local suites by name, source and status: %s',
    async (query, expected) => {
      await renderNavigation({
        initialEntry: `/suites?${query}`,
        component: (
          <SuitesList
            suites={['Alpha', 'Beta', 'Gamma'].map((name, index) => ({
              name,
              slug: suiteId({ name }),
              ...(index === 1 ? { filepath: 'src/accuracy.eval.ts' } : {}),
              runCount: 1,
              latestStatus: index === 1 ? 'failed' : 'passed',
              latestRunTimestamp: '2026-10-01T00:00:00Z',
              latestDuration: 1,
              latestMeanScore: 1,
              latestPassedCount: index === 2 ? 0 : 1,
              latestTotalCount: index === 2 ? 0 : 1,
            }))}
          />
        ),
      });
      for (const name of ['Alpha', 'Beta', 'Gamma'])
        expect(Boolean(screen.queryByText(name))).toBe(expected.includes(name));
      if (query === '') {
        fireEvent.pointerDown(
          screen.getByRole('button', { name: 'Pass Rate' }),
          { button: 0, ctrlKey: false }
        );
        fireEvent.click(screen.getByRole('menuitem', { name: 'Asc' }));
        expect(
          screen.getAllByRole('button', { name: /Alpha|Beta|Gamma/ })[0]
            .textContent
        ).toContain('Gamma');
      }
    }
  );

  it('should clear default status, sort and text filters while resetting pagination', async () => {
    const { router } = await renderNavigation({
      initialEntry: '/datasets?page=3&q=old&status=failed&sort=name',
      component: (
        <ListFilter
          config={{
            search: { type: 'text' },
            statusOptions: [{ label: 'Failed', value: 'failed' }],
            sortOptions: [
              { label: 'Recent', value: 'recent' },
              { label: 'Name', value: 'name' },
            ],
          }}
        />
      ),
    });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
    await waitFor(() =>
      expect(
        new URLSearchParams(router.state.location.searchStr).has('q')
      ).toBe(false)
    );
    fireEvent.click(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByRole('option', { name: 'All' }));
    await waitFor(() =>
      expect(
        new URLSearchParams(router.state.location.searchStr).has('status')
      ).toBe(false)
    );
    fireEvent.click(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByRole('option', { name: 'Recent' }));
    await waitFor(() => expect(router.state.location.searchStr).toBe(''));
    fireEvent.click(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByRole('option', { name: 'Name' }));
    await waitFor(() =>
      expect(
        new URLSearchParams(router.state.location.searchStr).get('sort')
      ).toBe('name')
    );
  });

  it.each(['from', 'to'] as const)(
    'should set and clear the %s date filter from calendar interactions',
    async (bound) => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 9, 1));
      const { router } = await renderNavigation({
        initialEntry: '/results?page=3',
        component: <ListFilter config={{ search: { type: 'date-range' } }} />,
      });
      fireEvent.click(
        screen.getByRole('button', { name: bound === 'from' ? 'From' : 'To' })
      );
      const selectable = screen.getByRole('button', {
        name: /October 15th, 2026/,
      });
      fireEvent.click(selectable);
      await waitFor(() =>
        expect(
          new URLSearchParams(router.state.location.searchStr).get(bound)
        ).toBeTruthy()
      );
      expect(
        new URLSearchParams(router.state.location.searchStr).has('page')
      ).toBe(false);
      fireEvent.click(
        screen.getByRole('button', { name: /October 15th, 2026/ })
      );
      await waitFor(() => expect(router.state.location.searchStr).toBe(''));
    }
  );

  it('should hide requested result columns without hiding the remaining cells', async () => {
    stubTags();
    await renderNavigation({
      component: (
        <ResultsTable hiddenColumnIds={['status', 'name']} results={[]} />
      ),
      initialEntry: '/results',
    });
    expect(screen.queryByRole('button', { name: 'Status' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Run' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Duration' })).toBeTruthy();
  });
  it('should replace filter queries while preserving unrelated parameters and reset them', async () => {
    const { router, history } = await renderNavigation({
      component: <ListFilter config={{ search: { type: 'text' } }} />,
      initialEntry: '/datasets?q=before&status=passed&custom=a%26b',
    });

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'space & slash/' },
    });

    await waitFor(() => {
      const params = new URLSearchParams(router.state.location.searchStr);
      expect(params.get('q')).toBe('space & slash/');
      expect(params.get('status')).toBe('passed');
      expect(params.get('custom')).toBe('a&b');
    });
    expect(history.length).toBe(1);

    fireEvent.click(screen.getByTitle('Reset filters'));
    await waitFor(() => expect(router.state.location.searchStr).toBe(''));
    expect(history.length).toBe(1);
  });

  it('should filter dataset rows from the URL and react to browser navigation', async () => {
    stubTags();
    const { router } = await renderNavigation({
      component: (
        <DatasetsList
          datasets={[
            { id: 'alpha', name: 'Alpha', itemCount: 1, source: 'file' },
            { id: 'beta', name: 'Beta', itemCount: 2, source: 'file' },
          ]}
        />
      ),
      initialEntry: '/datasets?q=Alpha',
    });
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.queryByText('Beta')).toBeNull();

    await act(async () => {
      await router.navigate({ href: '/datasets?q=Beta' });
    });
    expect(screen.queryByText('Alpha')).toBeNull();
    expect(screen.getByText('Beta')).toBeTruthy();
  });

  it('should encode a result ID exactly once when navigating from a table', async () => {
    stubTags();
    const id = 'folder/run %?#.json';
    const { router } = await renderNavigation({
      component: (
        <ResultsTable
          results={[
            {
              id,
              runId: 'run',
              name: 'Encoded run',
              path: id,
              size: 1,
              summary: null,
            },
          ]}
        />
      ),
      initialEntry: '/results',
    });

    fireEvent.click(screen.getByText('Encoded run'));
    await waitFor(() =>
      expect(router.state.matches.at(-1)?.params).toEqual({ id })
    );
    expect(
      new URL(router.state.location.href, 'http://localhost').pathname
    ).toBe(`/results/${encodeURIComponent(id)}`);
  });
});

function stubTags() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) =>
      Response.json({ data: input === '/api/tags' ? [] : {} })
    )
  );
}

async function renderNavigation({
  component,
  initialEntry,
}: {
  component: ReactNode;
  initialEntry: string;
}) {
  const rootRoute = createRootRoute();
  const datasetsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/datasets',
    component: () => component,
  });
  const resultsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/results',
    component: () => component,
  });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/results/$id',
    component: () => <div>Result detail</div>,
  });
  const suitesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/suites',
    component: () => component,
  });
  const history = createMemoryHistory({ initialEntries: [initialEntry] });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      datasetsRoute,
      resultsRoute,
      detailRoute,
      suitesRoute,
    ]),
    history,
  });
  await act(async () => {
    await router.load();
    render(<RouterProvider router={router} />);
  });
  return { router, history };
}
