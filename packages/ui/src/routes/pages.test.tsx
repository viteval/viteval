// @vitest-environment jsdom
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getRouter } from '@/router';
import { reportFixture, writeListingFixtures } from '@/sdk/test-fixtures';
import { suiteId } from '@/lib/suite-id';
import { GET as getResult } from '@/server/api-result';
import { GET as getTags } from '@/server/api-tags';
import { POST as lookupTags } from '@/server/api-taggings-lookup';
import { Route as rootRoute } from './__root';
import { createViteval } from '@/sdk';

const documentShell: unknown = Reflect.get(rootRoute.options, 'shellComponent');

// The unit runner has no Start RPC compiler or request cookie context.
// Adapt those framework boundaries while exercising real route loaders and storage.
vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    function builder<T>(validator?: { parse: (value: unknown) => T }) {
      return {
        validator: <Next,>(schema: { parse: (value: unknown) => Next }) =>
          builder(schema),
        handler:
          <Result,>(handler: (context: { data: T | undefined }) => Result) =>
          (options?: { data: T }) =>
            handler({
              data: validator ? validator.parse(options?.data) : options?.data,
            }),
      };
    }
    return builder();
  },
}));
vi.mock('@tanstack/react-start/server', () => ({ getCookie: () => undefined }));

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'viteval-route-interaction-'));
  vi.stubEnv('VITEVAL_ROOT_PATH', root);
  localStorage.clear();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
  vi.stubGlobal('ResizeObserver', function () {
    return { observe() {}, unobserve() {}, disconnect() {} };
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const request = new Request(`http://localhost${input}`, init);
      if (input === '/api/tags') return getTags(request);
      if (input === '/api/taggings/lookup') return lookupTags(request);
      return getResult(request, {
        params: { id: decodeURIComponent(input.slice('/api/results/'.length)) },
      });
    })
  );
});
afterEach(async () => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  localStorage.clear();
  await rm(root, { recursive: true, force: true });
});

async function renderPage(href: string) {
  const router = getRouter();
  // Browser route interaction tests mount inside a test container, not a second
  // HTML document. The production document shell is covered by packaged SSR.
  if (!router.options.routeTree) throw new Error('Missing route tree');
  Object.assign(router.options.routeTree.options, {
    shellComponent: ({ children }: { children: ReactNode }) => <>{children}</>,
  });
  router.update({ history: createMemoryHistory({ initialEntries: [href] }) });
  await act(async () => {
    await router.load();
    render(<RouterProvider router={router} />);
  });
  return router;
}

describe('production page routes', () => {
  it.each(['datasets', 'results'] as const)(
    'should warn about invalid %s files without hiding valid records',
    async (resource) => {
      await writeListingFixtures(root);
      await writeFile(
        path.join(root, '.viteval', resource, 'invalid.json'),
        '{}'
      );
      await renderPage(`/${resource}`);
      expect(screen.getByRole('alert').textContent).toBe(
        `Invalid ${resource === 'datasets' ? 'dataset' : 'result'} file: invalid.json`
      );
      expect(
        screen.getByText(resource === 'datasets' ? 'Dataset 00' : 'Run 24')
      ).toBeTruthy();
    }
  );
  it('should load the real settings route and its page title', async () => {
    const router = await renderPage('/settings');
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeTruthy();
    expect(router.state.matches.at(-1)?.meta).toContainEqual({
      title: 'Settings | Viteval',
    });
  });
  it('should show an empty errored run without manufacturing suite names or a start timestamp', async () => {
    await mkdir(path.join(root, '.viteval/results'), { recursive: true });
    await writeFile(
      path.join(root, '.viteval/results/empty.json'),
      JSON.stringify({
        ...reportFixture({ id: 'empty', suites: [] }),
        startTime: 0,
        duration: undefined,
        errors: ['No evaluations collected'],
      })
    );
    await renderPage('/results/empty');
    expect(screen.getByRole('alert').textContent).toBe(
      'No evaluations collected'
    );
    expect(screen.getByText('0 evals')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'View Eval' })).toBeNull();
  });
  it('should keep an epoch-started run navigable on the dashboard without displaying a timestamp', async () => {
    await mkdir(path.join(root, '.viteval/results'), { recursive: true });
    await writeFile(
      path.join(root, '.viteval/results/epoch.json'),
      JSON.stringify({
        ...reportFixture({ id: 'epoch', suites: [] }),
        startTime: 0,
      })
    );
    await renderPage('/');
    const link = screen.getByRole('link', { name: /Run 00/ });
    expect(link.getAttribute('href')).toBe('/results/epoch');
    expect(within(link).queryByText(/1970/)).toBeNull();
    expect(within(link).getByText('0/0')).toBeTruthy();
  });
  it.each([
    { route: '/datasets', entityType: 'dataset', entityId: 'dataset-0' },
    { route: '/results', entityType: 'eval_run', entityId: 'run-24' },
  ] as const)(
    'should display persisted tags in the $route table',
    async ({ route, entityType, entityId }) => {
      await writeListingFixtures(root);
      const sdk = createViteval({ root });
      const tag = await sdk.tags.create({ name: 'Review required' });
      if (!tag.data) throw new Error('Unable to create tag fixture');
      await sdk.tags.addTagging({ tagId: tag.data.id, entityType, entityId });
      await renderPage(route);
      expect(await screen.findByText('Review required')).toBeTruthy();
    }
  );
  it('should render the real document shell and its route metadata during SSR', async () => {
    const router = getRouter();
    Object.assign(rootRoute.options, { shellComponent: documentShell });
    router.update({ history: createMemoryHistory({ initialEntries: ['/'] }) });
    await router.load();
    const html = renderToString(<RouterProvider router={router} />);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('Local UI for viewing the results of your evals');
    expect(html).toContain('No results yet');
    expect(html).toContain('/favicon.ico');
  });
  it.each([0, 2])(
    'should poll running results every configured interval (%s seconds) and stop after completion',
    async (seconds) => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
      localStorage.setItem(
        'viteval:settings',
        JSON.stringify({ autoRefreshInterval: seconds })
      );
      await mkdir(path.join(root, '.viteval/results'), { recursive: true });
      const filename = path.join(root, '.viteval/results/live.json');
      const initial = {
        ...reportFixture({ id: 'live' }),
        status: 'running',
        duration: undefined,
      };
      await writeFile(filename, JSON.stringify(initial));
      await renderPage('/results/live');
      await waitFor(() =>
        expect(screen.getByRole('heading', { name: 'Run 00' })).toBeTruthy()
      );
      const count = () =>
        vi
          .mocked(fetch)
          .mock.calls.filter(([url]) => String(url).startsWith('/api/results/'))
          .length;
      const before = count();
      await writeFile(
        filename,
        JSON.stringify({
          ...initial,
          status: 'finished',
          errors: ['Suite cleanup failed'],
        })
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync((seconds || 20) * 1000);
      });
      await waitFor(() =>
        expect(screen.getByRole('alert').textContent).toContain(
          'Suite cleanup failed'
        )
      );
      expect(count()).toBe(before + 1);
      const completed = count();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });
      expect(count()).toBe(completed);
    }
  );
  it('should render empty dashboard calls to action and navigate through the persistent sidebar', async () => {
    const router = await renderPage('/');
    expect(screen.getByText('No results yet')).toBeTruthy();
    expect(screen.getByText('No datasets yet')).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: 'Datasets' }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/datasets')
    );
    expect(
      await screen.findByRole('heading', { name: 'Datasets' })
    ).toBeTruthy();
    await act(async () => router.navigate({ to: '/results' }));
    expect(screen.getByRole('heading', { name: 'Results' })).toBeTruthy();
    await act(async () => router.navigate({ to: '/suites' }));
    expect(screen.getByRole('heading', { name: 'Evals' })).toBeTruthy();
  });
  it('should show recent results and datasets with working links to real detail routes', async () => {
    await writeListingFixtures(root);
    const router = await renderPage('/');
    expect(screen.getByText('Eval Runs — Passed vs Failed')).toBeTruthy();
    expect(screen.getByText('Running')).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: /Dataset 24/ }));
    expect(
      await screen.findByRole('heading', { name: 'Dataset 24' })
    ).toBeTruthy();
    expect(screen.getByText('25 items')).toBeTruthy();
    await act(async () => router.navigate({ href: '/results/run-0' }));
    expect(await screen.findByRole('heading', { name: 'Run 00' })).toBeTruthy();
    const evalLinks = screen.getAllByRole('link', { name: 'View Eval' });
    expect(evalLinks).toHaveLength(2);
    expect(evalLinks[0].getAttribute('href')).toBe(
      evalLinks[1].getAttribute('href')
    );
    expect(screen.getByRole('link', { name: /Back to Results/ })).toBeTruthy();
    const breadcrumb = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(within(breadcrumb).getByText('Run-0')).toBeTruthy();
  });
  it('should render suite history and switch to the actual evaluation source', async () => {
    await writeListingFixtures(root);
    await mkdir(path.join(root, 'src'), { recursive: true });
    await writeFile(
      path.join(root, 'src/accuracy.eval.ts'),
      'export const actualSource = 42;'
    );
    const id = suiteId({ name: 'Eval 00', filepath: 'src/accuracy.eval.ts' });
    await renderPage(`/suites/${encodeURIComponent(id)}`);
    expect(screen.getByRole('heading', { name: 'Eval 00' })).toBeTruthy();
    expect(screen.getByText('Run 00')).toBeTruthy();
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Source' }), {
      button: 0,
      ctrlKey: false,
    });
    expect(screen.getByRole('tabpanel').textContent).toContain('actualSource');
  });
  it.each([
    '/datasets/missing',
    '/suites/missing',
    '/results/missing',
    '/unknown/page',
  ])('should render missing resource feedback at %s', async (href) => {
    await renderPage(href);
    expect(screen.getByText('404')).toBeTruthy();
  });
  it('should surface malformed dataset and result files instead of pretending they are missing', async () => {
    await mkdir(path.join(root, '.viteval/datasets'), { recursive: true });
    await mkdir(path.join(root, '.viteval/results'), { recursive: true });
    await writeFile(
      path.join(root, '.viteval/datasets/broken.json'),
      '{broken'
    );
    await writeFile(path.join(root, '.viteval/results/broken.json'), '{}');
    const router = await renderPage('/datasets/broken');
    expect(await screen.findByRole('heading', { name: 'Error' })).toBeTruthy();
    expect(screen.getByText(/Unable to read dataset file/)).toBeTruthy();
    await act(async () => router.navigate({ href: '/results/broken' }));
    expect(await screen.findByText('Failed to load result (500)')).toBeTruthy();
  });
  it.each([404, 503, 'network', 'unknown'] as const)(
    'should display live refresh failure %s after initial data loads',
    async (failure) => {
      await mkdir(path.join(root, '.viteval/results'), { recursive: true });
      await writeFile(
        path.join(root, '.viteval/results/run.json'),
        JSON.stringify(reportFixture({ id: 'run' }))
      );
      const original = vi.mocked(fetch).getMockImplementation()!;
      vi.mocked(fetch).mockImplementation(async (input, init) => {
        if (String(input).startsWith('/api/results/')) {
          if (failure === 'network') throw new Error('Connection lost');
          if (failure === 'unknown') throw 'network down';
          return Response.json({}, { status: failure });
        }
        return original(input, init);
      });
      await renderPage('/results/run');
      if (failure === 404)
        expect(
          await screen.findByRole('heading', { name: 'Result Not Found' })
        ).toBeTruthy();
      else
        expect(
          await screen.findByText(
            failure === 'network'
              ? 'Connection lost'
              : failure === 'unknown'
                ? 'Failed to load result'
                : 'Failed to load result (503)'
          )
        ).toBeTruthy();
    }
  );
});
