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
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatasetsList } from './datasets-list';
import { ListFilter } from './list-filter';
import { ResultsTable } from './results-table';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('component navigation', () => {
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
  const history = createMemoryHistory({ initialEntries: [initialEntry] });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      datasetsRoute,
      resultsRoute,
      detailRoute,
    ]),
    history,
  });
  await act(async () => {
    await router.load();
    render(<RouterProvider router={router} />);
  });
  return { router, history };
}
