// @vitest-environment jsdom
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { createViteval } from '@/sdk';
import { reportFixture, writeListingFixtures } from '@/sdk/test-fixtures';
import {
  datasetsSearchSchema,
  resultsSearchSchema,
  suitesSearchSchema,
} from '@/server/search';
import { useRemoteTable } from '@/hooks/use-remote-table';
import { getRouter } from '@/router';
import { suiteId } from '@/lib/suite-id';
import { DatasetsList } from './datasets-list';
import { ResultsList } from './results-list';
import { SuitesList } from './suites-list';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'viteval-remote-navigation-'));
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) =>
      Response.json({ data: input === '/api/tags' ? [] : {} })
    )
  );
  vi.stubGlobal('PointerEvent', MouseEvent);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Object.defineProperties(HTMLElement.prototype, {
    hasPointerCapture: { configurable: true, value: () => false },
    releasePointerCapture: { configurable: true, value: () => {} },
    scrollIntoView: { configurable: true, value: () => {} },
  });
});

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const property of [
    'hasPointerCapture',
    'releasePointerCapture',
    'scrollIntoView',
  ])
    Reflect.deleteProperty(HTMLElement.prototype, property);
  await rm(root, { force: true, recursive: true });
});

describe('remote table navigation', () => {
  it('should paginate and filter exact suite history without including a colliding project', async () => {
    await mkdir(path.join(root, '.viteval/results'), { recursive: true });
    const suite = {
      name: 'accuracy',
      projectName: 'gpt-4',
      filepath: 'src/accuracy.eval.ts',
    };
    for (let index = 0; index < 25; index++) {
      await writeFile(
        path.join(root, '.viteval/results', `history-${index}.json`),
        JSON.stringify(
          reportFixture({ id: `history-${index}`, index, suites: [suite] })
        )
      );
    }
    await writeFile(
      path.join(root, '.viteval/results/other.json'),
      JSON.stringify(
        reportFixture({
          id: 'other',
          suites: [{ ...suite, projectName: 'gpt_4' }],
        })
      )
    );
    const pathname = `/suites/${encodeURIComponent(suiteId(suite))}`;
    const { router } = await renderRemoteRouter(pathname);
    expect(screen.getByText('25 row(s)')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(screen.getByText('Run 00')).toBeTruthy());
    await act(async () =>
      router.navigate({
        href: `${pathname}?status=failed&sort=name&order=asc&limit=2&page=2`,
      })
    );
    expect(screen.getByText('12 row(s)')).toBeTruthy();
    expect(screen.getByText('Run 05')).toBeTruthy();
    expect(screen.getByText('Run 07')).toBeTruthy();
    expect(screen.queryByText('Run 00')).toBeNull();
  }, 15_000);
  it.each([
    { pathname: '/datasets', first: 'Dataset 00', next: 'Dataset 20' },
    { pathname: '/results', first: 'Run 24', next: 'Run 04' },
    { pathname: '/suites', first: 'Eval 00', next: 'Eval 20' },
  ])(
    'should fetch subsequent server pages and support browser back on $pathname',
    async ({ pathname, first, next }) => {
      await writeListingFixtures(root);
      const { router, history } = await renderRemoteRouter(
        `${pathname}?custom=%22keep%22&custom=a%26b`
      );
      expect(screen.getByText(first)).toBeTruthy();
      expect(screen.queryByText(next)).toBeNull();
      expect(screen.getByText('25 row(s)')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      await waitFor(() => expect(screen.getByText(next)).toBeTruthy());
      expect(screen.queryByText(first)).toBeNull();
      expect(
        new URLSearchParams(router.state.location.searchStr).get('page')
      ).toBe('2');
      expect(
        new URLSearchParams(router.state.location.searchStr).getAll('custom')
      ).toEqual(['"keep"', 'a&b']);
      expect(
        (screen.getByRole('button', { name: 'Next page' }) as HTMLButtonElement)
          .disabled
      ).toBe(true);
      await act(async () => history.back());
      await waitFor(() => expect(screen.getByText(first)).toBeTruthy());
    },
    15_000
  );

  it('should find a dataset outside the first page and reset the page when filters change', async () => {
    await writeListingFixtures(root);
    const { router } = await renderRemoteRouter(
      '/datasets?page=2&limit=20&custom=%5B1%2C2%5D'
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'unique remote' },
    });
    await waitFor(() => expect(screen.getByText('1 row(s)')).toBeTruthy());
    expect(screen.getByText('Dataset 24')).toBeTruthy();
    const query = new URLSearchParams(router.state.location.searchStr);
    expect(query.get('page')).toBe('1');
    expect(query.get('custom')).toBe('[1,2]');
    expect(query.get('limit')).toBe('20');
  });

  it('should apply global sorting and reset pagination through table headers', async () => {
    await writeListingFixtures(root);
    const { router } = await renderRemoteRouter(
      '/datasets?page=2&custom=%22keep%22'
    );
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Name' }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Desc' }));
    await waitFor(() => expect(screen.getByText('Dataset 05')).toBeTruthy());
    expect(screen.queryByText('Dataset 00')).toBeNull();
    expect(
      new URLSearchParams(router.state.location.searchStr).get('page')
    ).toBe('1');
    expect(
      new URLSearchParams(router.state.location.searchStr).get('sort')
    ).toBe('name');
    expect(
      new URLSearchParams(router.state.location.searchStr).get('order')
    ).toBe('desc');
  });

  it('should fetch a larger page when rows per page changes', async () => {
    await writeListingFixtures(root);
    const { router } = await renderRemoteRouter('/datasets?page=2&limit=20');
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: '50' }));
    await waitFor(() => expect(screen.getByText('Dataset 00')).toBeTruthy());
    expect(screen.getByText('Dataset 24')).toBeTruthy();
    expect(screen.getByText('1 / 1')).toBeTruthy();
    expect(
      new URLSearchParams(router.state.location.searchStr).get('limit')
    ).toBe('50');
    expect(
      new URLSearchParams(router.state.location.searchStr).get('page')
    ).toBe('1');
  });

  it('should keep empty remote tables at zero pages with all navigation disabled', async () => {
    await renderRemoteRouter('/datasets?page=5');
    expect(screen.getByText('0 row(s)')).toBeTruthy();
    expect(screen.getByText('0 / 0')).toBeTruthy();
    for (const name of [
      'First page',
      'Previous page',
      'Next page',
      'Last page',
    ]) {
      expect(
        (screen.getByRole('button', { name }) as HTMLButtonElement).disabled
      ).toBe(true);
    }
  });

  it('should encode raw dataset and collision-free suite identities once on row navigation', async () => {
    const datasetId = 'folder/data %?#';
    await mkdir(path.join(root, '.viteval/datasets'), { recursive: true });
    await writeFile(
      path.join(
        root,
        '.viteval/datasets',
        `${encodeURIComponent(datasetId)}.json`
      ),
      JSON.stringify({ id: datasetId, name: 'Encoded dataset', data: [] })
    );
    const { router } = await renderRemoteRouter('/datasets');
    fireEvent.click(screen.getByText('Encoded dataset'));
    await waitFor(() =>
      expect(router.state.matches.at(-1)?.params).toEqual({ id: datasetId })
    );
    expect(
      new URL(router.state.location.href, 'http://localhost').pathname
    ).toBe(`/datasets/${encodeURIComponent(datasetId)}`);
    await mkdir(path.join(root, '.viteval/results'), { recursive: true });
    const identities = ['gpt-4', 'gpt_4'].map((projectName) => ({
      name: 'accuracy',
      projectName,
      filepath: 'src/accuracy.eval.ts',
    }));
    await writeFile(
      path.join(root, '.viteval/results/identities.json'),
      JSON.stringify(reportFixture({ id: 'identities', suites: identities }))
    );
    for (const identity of identities) {
      await act(async () => router.navigate({ href: '/suites' }));
      fireEvent.click(screen.getByText(`accuracy [${identity.projectName}]`));
      await waitFor(() =>
        expect(router.state.matches.at(-1)?.params).toEqual({
          slug: suiteId(identity),
        })
      );
      expect(
        decodeURIComponent(
          new URL(
            router.state.location.href,
            'http://localhost'
          ).pathname.slice('/suites/'.length)
        )
      ).toBe(suiteId(identity));
      expect(router.state.location.href).not.toContain('%252F');
    }
  });
});

async function renderRemoteRouter(initialEntry: string) {
  const sdk = createViteval({ root });
  const rootRoute = createRootRoute();
  const datasetsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/datasets',
    validateSearch: datasetsSearchSchema,
    loaderDeps: ({ search }) => search,
    loader: ({ deps }) => sdk.datasets.list(deps),
    component: DatasetPage,
  });
  function DatasetPage(): ReactElement {
    const response: Awaited<ReturnType<typeof sdk.datasets.list>> =
      datasetsRoute.useLoaderData();
    return (
      <DatasetsList
        datasets={response.data}
        remote={useRemoteTable(response)}
      />
    );
  }
  const resultsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/results',
    validateSearch: resultsSearchSchema,
    loaderDeps: ({ search }) => search,
    loader: ({ deps }) => sdk.results.list(deps),
    component: ResultPage,
  });
  function ResultPage(): ReactElement {
    const response: Awaited<ReturnType<typeof sdk.results.list>> =
      resultsRoute.useLoaderData();
    return (
      <ResultsList results={response.data} remote={useRemoteTable(response)} />
    );
  }
  const suitesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/suites',
    validateSearch: suitesSearchSchema,
    loaderDeps: ({ search }) => search,
    loader: ({ deps }) => sdk.suites.list(deps),
    component: SuitePage,
  });
  function SuitePage(): ReactElement {
    const response: Awaited<ReturnType<typeof sdk.suites.list>> =
      suitesRoute.useLoaderData();
    return (
      <SuitesList suites={response.data} remote={useRemoteTable(response)} />
    );
  }
  const datasetDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/datasets/$id',
    component: () => <div>Dataset detail</div>,
  });
  const suiteDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/suites/$slug',
    validateSearch: resultsSearchSchema,
    loaderDeps: ({ search }) => search,
    loader: async ({ deps, params }) => {
      const suite = await sdk.suites.get({ slug: params.slug });
      if (!suite.data) throw new Error('Suite not found');
      return sdk.results.list({ ...deps, suiteId: suite.data.slug });
    },
    component: SuiteHistory,
  });
  function SuiteHistory(): ReactElement {
    const response: Awaited<ReturnType<typeof sdk.results.list>> =
      suiteDetailRoute.useLoaderData();
    return (
      <ResultsList results={response.data} remote={useRemoteTable(response)} />
    );
  }
  const history = createMemoryHistory({ initialEntries: [initialEntry] });
  const { parseSearch, stringifySearch } = getRouter().options;
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      datasetsRoute,
      resultsRoute,
      suitesRoute,
      datasetDetailRoute,
      suiteDetailRoute,
    ]),
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
