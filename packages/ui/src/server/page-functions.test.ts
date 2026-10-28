import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reportFixture, writeListingFixtures } from '@/sdk/test-fixtures';
import { suiteId } from '@/lib/suite-id';
import {
  getDashboard,
  getDataset,
  getDatasets,
  getResult,
  getResults,
  getSuiteDetail,
  getSuites,
} from './page-functions';

// Vitest does not apply Start's RPC compiler. Execute its validated handler
// boundary locally; storage, serialization and page queries remain real.
vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    function builder<T>(validator?: { parse: (value: unknown) => T }) {
      return {
        validator: <Next>(schema: { parse: (value: unknown) => Next }) =>
          builder(schema),
        handler:
          <Result>(handler: (context: { data: T | undefined }) => Result) =>
          (options?: { data: T }) =>
            handler({
              data: validator ? validator.parse(options?.data) : options?.data,
            }),
      };
    }
    return builder();
  },
}));

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'viteval-page-data-'));
  vi.stubEnv('VITEVAL_ROOT_PATH', root);
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(root, { recursive: true, force: true });
});

describe('server page data functions', () => {
  it('should load independent dashboard totals, recent pages and chart history', async () => {
    await writeListingFixtures(root);
    expect(await getDashboard()).toMatchObject({
      resultsResponse: {
        total: 25,
        data: Array.from({ length: 5 }, (_, index) => ({
          id: `run-${24 - index}`,
        })),
      },
      chartResponse: { total: 25, data: expect.any(Array) },
      datasetsResponse: {
        total: 25,
        data: [
          { id: 'dataset-24' },
          { id: 'dataset-23' },
          { id: 'dataset-22' },
          { id: 'dataset-21' },
          { id: 'dataset-20' },
        ],
      },
    });
  });
  it('should apply search and pagination to each page listing', async () => {
    await writeListingFixtures(root);
    expect(
      await getDatasets({ data: { q: 'Dataset 24', page: 1, limit: 20 } })
    ).toMatchObject({ total: 1, data: [{ id: 'dataset-24' }] });
    expect(
      await getResults({ data: { status: 'running', page: 1, limit: 20 } })
    ).toMatchObject({ total: 1, data: [{ id: 'run-24' }] });
    expect(
      await getSuites({ data: { q: 'Eval 24', page: 1, limit: 20 } })
    ).toMatchObject({ total: 1, data: [{ name: 'Eval 24' }] });
  });
  it('should return serializable missing and populated detail pages', async () => {
    expect(await getDataset({ data: { id: 'missing' } })).toEqual({
      data: null,
    });
    expect(await getResult({ data: { id: 'missing' } })).toEqual({
      data: null,
    });
    await writeListingFixtures(root);
    expect(await getDataset({ data: { id: 'dataset-0' } })).toMatchObject({
      data: { id: 'dataset-0', data: [{ input: 0 }] },
    });
    expect(await getResult({ data: { id: 'run-0' } })).toMatchObject({
      data: { runId: 'run-0' },
    });
  });
  it('should qualify suite history and load optional source files', async () => {
    expect(
      await getSuiteDetail({ data: { slug: 'missing', page: 1, limit: 20 } })
    ).toBeNull();
    await mkdir(path.join(root, '.viteval/results'), { recursive: true });
    await mkdir(path.join(root, 'src'), { recursive: true });
    await writeFile(
      path.join(root, 'src/accuracy.eval.ts'),
      'export const suite = "accuracy";'
    );
    const suites = [
      { name: 'accuracy', filepath: 'src/accuracy.eval.ts' },
      { name: 'no-source' },
    ];
    await writeFile(
      path.join(root, '.viteval/results/run.json'),
      JSON.stringify(reportFixture({ id: 'run', suites }))
    );
    expect(
      await getSuiteDetail({
        data: { slug: suiteId(suites[0]), page: 1, limit: 20 },
      })
    ).toMatchObject({
      suiteResults: { total: 1 },
      latestSource: 'export const suite = "accuracy";',
    });
    expect(
      await getSuiteDetail({
        data: { slug: suiteId(suites[1]), page: 1, limit: 20 },
      })
    ).toMatchObject({ suiteResults: { total: 1 }, latestSource: null });
  });
});
