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

import { ListFilter } from '@/components/list-filter';
import { paginationSearchSchema } from '@/server/search';

import { getRouter } from './router';

afterEach(cleanup);

describe('router query codec', () => {
  it.each([
    '"foo"',
    '""',
    '[1, 2]',
    '{"nested": true}',
    'true',
    'null',
    '001',
    '0',
    'space & slash/',
    'a+b',
  ])(
    'should preserve literal query text %s during navigation',
    async (text) => {
      const { router } = await renderQueryRouter('/datasets');
      const query = new URLSearchParams({ q: text });
      await act(async () => {
        await router.navigate({ href: `/datasets?${query}` });
      });

      expect(
        new URLSearchParams(router.state.location.searchStr).get('q')
      ).toBe(text);
    }
  );

  it('should serialize repeated values as repeated keys rather than JSON arrays', async () => {
    const { router } = await renderQueryRouter('/datasets');
    const query = new URLSearchParams([
      ['custom', 'a'],
      ['custom', '"keep"'],
      ['custom', '[1, 2]'],
      ['empty', ''],
    ]);
    await act(async () => {
      await router.navigate({ href: `/datasets?${query}` });
    });
    const params = new URLSearchParams(router.state.location.searchStr);

    expect(params.getAll('custom')).toEqual(['a', '"keep"', '[1, 2]']);
    expect(params.has('empty')).toBe(true);
    expect(params.get('empty')).toBe('');
  });

  it('should preserve unrelated repeated queries when filters replace and reset navigation', async () => {
    const query = new URLSearchParams([
      ['q', '"before"'],
      ['custom', '"keep"'],
      ['custom', '[1, 2]'],
      ['status', 'passed'],
    ]);
    const { router, history } = await renderQueryRouter(`/datasets?${query}`);
    const input = screen.getByRole('textbox');
    expect(screen.getByDisplayValue('"before"')).toBe(input);

    for (const text of ['"after"', '[1, 2]', '{"key": "value"}']) {
      fireEvent.change(input, { target: { value: text } });
      await waitFor(() => {
        const params = new URLSearchParams(router.state.location.searchStr);
        expect(params.get('q')).toBe(text);
        expect(params.getAll('custom')).toEqual(['"keep"', '[1, 2]']);
        expect(params.get('status')).toBe('passed');
      });
      expect(history.length).toBe(1);
    }

    fireEvent.click(screen.getByTitle('Reset filters'));
    await waitFor(() => {
      const params = new URLSearchParams(router.state.location.searchStr);
      expect(params.has('q')).toBe(false);
      expect(params.has('custom')).toBe(false);
      expect(params.has('status')).toBe(false);
    });
    expect(history.length).toBe(1);
  });

  it('should leave pagination coercion to route validation during native navigation', async () => {
    const { router } = await renderQueryRouter('/datasets');

    for (const [query, expected] of [
      ['', { page: 1, limit: 20 }],
      ['page=2.9&limit=5000', { page: 2, limit: 1000 }],
      ['page=invalid&limit=-4', { page: 1, limit: 1 }],
      ['page=3&page=4&limit=5&limit=6', { page: 3, limit: 5 }],
    ] as const) {
      await act(async () => {
        await router.navigate({ href: `/datasets?${query}` });
      });
      expect(router.state.matches.at(-1)?.search).toMatchObject(expected);
      expect(router.state.matches.at(-1)?.loaderData).toEqual(expected);
    }
  });
});

async function renderQueryRouter(initialEntry: string) {
  const { parseSearch, stringifySearch } = getRouter().options;
  const rootRoute = createRootRoute();
  const datasetsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/datasets',
    validateSearch: paginationSearchSchema,
    loaderDeps: ({ search }) => ({ page: search.page, limit: search.limit }),
    loader: ({ deps }) => deps,
    component: () => <ListFilter config={{ search: { type: 'text' } }} />,
  });
  const history = createMemoryHistory({ initialEntries: [initialEntry] });
  const router = createRouter({
    routeTree: rootRoute.addChildren([datasetsRoute]),
    history,
    parseSearch,
    stringifySearch,
  });
  await act(async () => {
    await router.load();
    render(<RouterProvider router={router} />);
  });
  return { router, history };
}
