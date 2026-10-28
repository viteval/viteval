import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createViteval } from './client';
import { reportFixture, writeListingFixtures } from './test-fixtures';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'viteval-list-order-'));
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(root, { recursive: true, force: true });
});

describe('server listing sort contracts', () => {
  it('should warn about an empty report file and retain other valid results', async () => {
    await mkdir(path.join(root, '.viteval/results'), { recursive: true });
    await writeFile(path.join(root, '.viteval/results/empty.json'), '');
    await writeFile(
      path.join(root, '.viteval/results/valid.json'),
      JSON.stringify(reportFixture({ id: 'valid' }))
    );
    expect(await createViteval({ root }).results.list()).toMatchObject({
      data: [{ id: 'valid' }],
      warnings: ['Invalid result file: empty.json'],
    });
  });
  it('should list an in-progress V1 report before its end time and duration are recorded', async () => {
    await mkdir(path.join(root, '.viteval/results'), { recursive: true });
    await writeFile(
      path.join(root, '.viteval/results/live.json'),
      JSON.stringify({
        ...reportFixture({ id: 'live', suites: [] }),
        status: 'running',
        endTime: undefined,
        duration: undefined,
      })
    );
    expect(await createViteval({ root }).results.list()).toMatchObject({
      data: [
        {
          id: 'live',
          summary: {
            duration: 0,
            endTime: Date.UTC(2026, 9, 1),
            status: 'running',
          },
        },
      ],
    });
  });
  it('should preserve a parse error from a requested nested dataset path', async () => {
    await mkdir(path.join(root, '.viteval/datasets/nested'), {
      recursive: true,
    });
    await writeFile(
      path.join(root, '.viteval/datasets/nested/broken.json'),
      '{broken'
    );
    expect(
      await createViteval({ root }).datasets.get({ id: 'nested/broken' })
    ).toHaveProperty('error');
  });
  it('should select the current project when neither a root option nor an environment root is configured', async () => {
    vi.stubEnv('VITEVAL_ROOT_PATH', undefined);
    const client = createViteval();
    expect(await client.results.get({ id: '../not-a-run' })).toEqual({
      data: null,
    });
  });
  it('should use ascending ordering by default for an explicitly selected field', async () => {
    await writeListingFixtures(root);
    const listing = await createViteval({ root }).results.list({
      sort: 'name',
    });
    expect(listing.data[0].name).toBe('Run 00');
  });
  it('should sort suites with no executed cases at a zero pass rate', async () => {
    await mkdir(path.join(root, '.viteval/results'), { recursive: true });
    const report = reportFixture({ id: 'empty' });
    const suite = report.evalResults[0];
    await writeFile(
      path.join(root, '.viteval/results/empty.json'),
      JSON.stringify({
        ...report,
        numTotalEvals: 0,
        numPassedEvals: 0,
        evalResults: [
          {
            ...suite,
            summary: {
              meanScore: 0,
              medianScore: 0,
              sumScore: 0,
              passedCount: 0,
              failedCount: 0,
              skippedCount: 0,
              totalCount: 0,
            },
            evalResults: [],
          },
        ],
      })
    );
    await writeFile(
      path.join(root, '.viteval/results/full.json'),
      JSON.stringify(
        reportFixture({ id: 'full', suites: [{ name: 'Full suite' }] })
      )
    );
    expect(
      (await createViteval({ root }).suites.list({ sort: 'passRate' })).data[0]
        .latestTotalCount
    ).toBe(0);
  });
  it.each([
    'startTime',
    'duration',
    'passed',
    'failed',
    'total',
    'status',
    'name',
  ])(
    'should sort all result records by %s in both directions before pagination',
    async (sort) => {
      await writeListingFixtures(root);
      const sdk = createViteval({ root });
      const asc = await sdk.results.list({
        sort,
        order: 'asc',
        limit: 100,
        from: 'not-a-date',
        to: 'also-invalid',
      });
      const desc = await sdk.results.list({ sort, order: 'desc', limit: 100 });
      const value = (record: (typeof asc.data)[number]) => {
        const summary = record.summary!;
        const values: Record<string, string | number> = {
          startTime: summary.startTime,
          duration: summary.duration,
          passed: summary.numPassedEvals,
          failed: summary.numFailedEvals,
          total: summary.numTotalEvals,
          name: record.name,
          status:
            summary.status === 'running'
              ? 'running'
              : summary.success
                ? 'passed'
                : 'failed',
        };
        return values[sort];
      };
      const compare = (a: string | number, b: string | number) =>
        typeof a === 'string' && typeof b === 'string'
          ? a.localeCompare(b)
          : Number(a) - Number(b);
      const values = asc.data.map(value);
      expect(values).toEqual(values.toSorted(compare));
      expect(desc.data.map(value)).toEqual(
        values.toSorted(compare).toReversed()
      );
      expect(asc.total).toBe(25);
    }
  );
  it.each(['source', 'createdAt', 'recent', 'name', 'itemCount'] as const)(
    'should honor dataset sorting by %s',
    async (sort) => {
      await writeListingFixtures(root);
      const sdk = createViteval({ root });
      const asc = await sdk.datasets.list({ sort, order: 'asc', limit: 100 });
      const desc = await sdk.datasets.list({ sort, order: 'desc', limit: 100 });
      expect(asc.total).toBe(25);
      if (sort !== 'source')
        expect(asc.data.map((item) => item.id)).toEqual(
          desc.data.map((item) => item.id).toReversed()
        );
      else expect(asc.data.every((item) => item.source === 'json')).toBe(true);
    }
  );
  it.each([
    'latestStatus',
    'runCount',
    'latestRunTimestamp',
    'latestMeanScore',
    'passRate',
  ])('should honor suite sorting by %s', async (sort) => {
    await writeListingFixtures(root);
    const sdk = createViteval({ root });
    const asc = await sdk.suites.list({ sort, order: 'asc', limit: 100 });
    const desc = await sdk.suites.list({ sort, order: 'desc', limit: 100 });
    const value = (item: (typeof asc.data)[number]) =>
      sort === 'passRate'
        ? item.latestPassedCount / item.latestTotalCount
        : item[
            sort as
              | 'latestStatus'
              | 'runCount'
              | 'latestRunTimestamp'
              | 'latestMeanScore'
          ];
    const values = asc.data.map(value);
    expect(desc.data.map(value)).toEqual(values.toReversed());
  });
  it('should retain the latest suite result independently of filename enumeration order and support filepath search', async () => {
    await mkdir(path.join(root, '.viteval/results'), { recursive: true });
    const suites = [{ name: 'same suite', filepath: 'src/unique.eval.ts' }];
    for (const [id, index] of [
      ['a-newest', 24],
      ['z-oldest', 1],
      ['m-middle', 2],
    ] as const) {
      await writeFile(
        path.join(root, '.viteval/results', `${id}.json`),
        JSON.stringify(reportFixture({ id, index, suites }))
      );
    }
    const sdk = createViteval({ root });
    expect(await sdk.suites.list({ q: 'UNIQUE.EVAL' })).toMatchObject({
      total: 1,
      data: [{ runCount: 3, latestStatus: 'running', latestDuration: 24 }],
    });
    expect(await sdk.results.list({ suite: 'same suite' })).toMatchObject({
      total: 3,
    });
    expect(await sdk.results.list({ suite: 'missing' })).toMatchObject({
      total: 0,
    });
  });
  it('should preserve item IDs and flatten metadata without losing scalar or array metadata', async () => {
    await mkdir(path.join(root, '.viteval/datasets'), { recursive: true });
    await writeFile(
      path.join(root, '.viteval/datasets/metadata.json'),
      JSON.stringify({
        schemaVersion: 1,
        id: 'metadata',
        name: 'metadata',
        version: 1,
        metadata: {},
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
        data: [
          {
            id: 'stable',
            input: 1,
            expected: null,
            extra: 'outer',
            metadata: { extra: 'inner', category: 'sample' },
          },
          { input: 2, expected: null, metadata: ['array'] },
          { input: 3, expected: null, metadata: null },
          { input: 4, expected: null, metadata: 5 },
          { input: 5, expected: null, extra: true },
        ],
      })
    );
    expect(
      await createViteval({ root }).datasets.get({ id: 'metadata' })
    ).toMatchObject({
      data: {
        name: 'metadata',
        data: [
          { id: 'stable', metadata: { extra: 'inner', category: 'sample' } },
          { id: 'metadata:1', metadata: { metadata: ['array'] } },
          { metadata: { metadata: null } },
          { metadata: { metadata: 5 } },
          { metadata: { extra: true } },
        ],
      },
    });
    expect(await createViteval({ root }).datasets.list()).toMatchObject({
      data: [{ name: 'metadata', itemCount: 5 }],
    });
  });
});
