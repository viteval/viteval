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
import { afterEach, describe, expect, it } from 'vitest';
import { useRemoteTable } from './use-remote-table';

afterEach(cleanup);

describe('useRemoteTable', () => {
  it('should accept direct and functional state updates and clear sorting without losing filters', async () => {
    function Controls() {
      const table = useRemoteTable({ total: 100, page: 3, limit: 10 });
      return (
        <>
          <button
            onClick={() =>
              table.onPaginationChange({ pageIndex: 3, pageSize: 10 })
            }
          >
            Direct page
          </button>
          <button
            onClick={() =>
              table.onPaginationChange((page) => ({ ...page, pageSize: 20 }))
            }
          >
            Resize
          </button>
          <button
            onClick={() => table.onSortingChange([{ id: 'name', desc: false }])}
          >
            Ascending
          </button>
          <button
            onClick={() =>
              table.onSortingChange(() => [{ id: 'name', desc: true }])
            }
          >
            Descending
          </button>
          <button onClick={() => table.onSortingChange([])}>
            Clear sorting
          </button>
        </>
      );
    }
    const root = createRootRoute();
    const route = createRoute({
      getParentRoute: () => root,
      path: '/results',
      component: Controls,
    });
    const router = createRouter({
      routeTree: root.addChildren([route]),
      history: createMemoryHistory({
        initialEntries: ['/results?status=passed&sort=startTime&order=desc'],
      }),
    });
    await act(async () => {
      await router.load();
      render(<RouterProvider router={router} />);
    });
    for (const [name, expected] of [
      ['Direct page', { page: '4', limit: '10' }],
      ['Resize', { page: '1', limit: '20' }],
      ['Ascending', { sort: 'name', order: 'asc' }],
      ['Descending', { sort: 'name', order: 'desc' }],
    ] as const) {
      fireEvent.click(screen.getByRole('button', { name }));
      await waitFor(() => {
        const params = new URLSearchParams(router.state.location.searchStr);
        for (const [key, value] of Object.entries(expected))
          expect(params.get(key)).toBe(value);
        expect(params.get('status')).toBe('passed');
      });
    }
    fireEvent.click(screen.getByRole('button', { name: 'Clear sorting' }));
    await waitFor(() => {
      const params = new URLSearchParams(router.state.location.searchStr);
      expect(params.has('sort')).toBe(false);
      expect(params.has('order')).toBe(false);
      expect(params.get('status')).toBe('passed');
    });
  });
});
