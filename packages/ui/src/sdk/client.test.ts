import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createJsonProvider } from '@viteval/core/provider';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isEvalPassed } from '@/lib/eval-status';
import { createViteval } from './client';
import { reportFixture, writeListingFixtures } from './test-fixtures';
import { suiteId } from '@/lib/suite-id';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'viteval-ui-sdk-'));
});
afterEach(async () => {
  await rm(root, { force: true, recursive: true });
});

describe('dashboard storage', () => {
  it('should preserve dataset names containing json suffixes through listing and detail reads', async () => {
    const provider = createJsonProvider({ root });
    const names = ['questions.json.release', 'questions.json'];
    for (const name of names) {
      const created = await provider.datasets!.create({
        name,
        items: [{ input: name, expected: name }],
      });
      if (!created.ok) throw created.error;
    }
    const sdk = createViteval({ root });
    const listed = await sdk.datasets.list();
    expect(listed.total).toBe(2);
    expect(listed.warnings).toEqual([]);
    expect(listed.data.map((dataset) => dataset.id).toSorted()).toEqual(
      names.toSorted()
    );
    for (const dataset of listed.data) {
      expect(await sdk.datasets.get({ id: dataset.id })).toMatchObject({
        data: { id: dataset.id, data: [{ input: dataset.id }] },
      });
    }
  });

  it('should filter and sort all records before paginating every listing', async () => {
    await writeListingFixtures(root);
    const sdk = createViteval({ root });
    expect(await sdk.results.list({ page: 2 })).toMatchObject({
      total: 25,
      page: 2,
      limit: 20,
      hasMore: false,
      data: [
        { id: 'run-4' },
        { id: 'run-3' },
        { id: 'run-2' },
        { id: 'run-1' },
        { id: 'run-0' },
      ],
    });
    expect(
      await sdk.results.list({
        status: 'failed',
        limit: 2,
        page: 2,
        sort: 'name',
        order: 'asc',
      })
    ).toMatchObject({
      total: 12,
      hasMore: true,
      data: [{ id: 'run-5' }, { id: 'run-7' }],
    });
    expect(
      await sdk.results.list({
        from: '2026-10-01T00:00:00Z',
        to: '2026-10-01T00:00:02Z',
        sort: 'duration',
        order: 'desc',
      })
    ).toMatchObject({
      total: 3,
      data: [{ id: 'run-2' }, { id: 'run-1' }, { id: 'run-0' }],
    });
    expect(
      await sdk.results.list({ status: 'passed', q: 'Run 24' })
    ).toMatchObject({ total: 0 });
    expect(await sdk.results.list({ status: 'running' })).toMatchObject({
      total: 1,
      data: [{ id: 'run-24' }],
    });
    expect(await sdk.datasets.list({ q: 'unique remote' })).toMatchObject({
      total: 1,
      data: [{ id: 'dataset-24' }],
    });
    expect(
      await sdk.datasets.list({
        limit: 2,
        sort: 'itemCount',
        order: 'desc',
        page: 2,
      })
    ).toMatchObject({
      total: 25,
      data: [{ id: 'dataset-22' }, { id: 'dataset-21' }],
    });
    expect(await sdk.datasets.list({ sort: 'recent', limit: 1 })).toMatchObject(
      { data: [{ id: 'dataset-24' }] }
    );
    expect(
      await sdk.suites.list({ q: 'Eval 24', status: 'running' })
    ).toMatchObject({ total: 1, data: [{ name: 'Eval 24' }] });
    expect(
      await sdk.suites.list({
        sort: 'latestDuration',
        order: 'desc',
        limit: 2,
        page: 2,
      })
    ).toMatchObject({
      total: 25,
      data: [{ name: 'Eval 22' }, { name: 'Eval 21' }],
    });
  });

  it('should resolve exact suite identities and reject ambiguous legacy slugs', async () => {
    await mkdir(path.join(root, '.viteval/results'), { recursive: true });
    const first = {
      name: 'accuracy',
      projectName: 'gpt-4',
      filepath: 'src/accuracy.eval.ts',
    };
    const second = { ...first, projectName: 'gpt_4' };
    const sameDisplay = [
      { name: 'accuracy [gpt]', projectName: 'x', filepath: first.filepath },
      { name: 'accuracy', projectName: 'gpt] [x', filepath: first.filepath },
    ];
    for (const [index, suite] of [first, second, ...sameDisplay].entries()) {
      await writeFile(
        path.join(root, '.viteval/results', `identity-${index}.json`),
        JSON.stringify(
          reportFixture({ id: `identity-${index}`, index, suites: [suite] })
        )
      );
    }
    const sdk = createViteval({ root });
    const listed = await sdk.suites.list();
    expect(listed.total).toBe(4);
    expect(new Set(listed.data.map((suite) => suite.slug)).size).toBe(4);
    expect(await sdk.suites.get({ slug: suiteId(first) })).toMatchObject({
      data: { name: 'accuracy [gpt-4]', latestDuration: 0 },
    });
    expect(await sdk.suites.get({ slug: suiteId(second) })).toMatchObject({
      data: { name: 'accuracy [gpt_4]', latestDuration: 1 },
    });
    expect(await sdk.suites.get({ slug: 'accuracy-gpt-4' })).toEqual({
      data: null,
    });
    expect(await sdk.suites.get({ slug: 'accuracy-gpt-x' })).toEqual({
      data: null,
    });
    expect(await sdk.results.list({ suiteId: suiteId(second) })).toMatchObject({
      total: 1,
      data: [{ id: 'identity-1' }],
    });
    await writeFile(
      path.join(root, '.viteval/results/unique.json'),
      JSON.stringify(
        reportFixture({ id: 'unique', suites: [{ name: 'Legacy unique' }] })
      )
    );
    expect(await sdk.suites.get({ slug: 'legacy-unique' })).toMatchObject({
      data: { name: 'Legacy unique' },
    });
  });

  it('should distinguish missing datasets from malformed JSON, schema failures, and filesystem errors', async () => {
    await mkdir(path.join(root, '.viteval/datasets'), { recursive: true });
    const sdk = createViteval({ root });
    expect(await sdk.datasets.get({ id: 'missing' })).toEqual({ data: null });
    for (const contents of ['{broken', 'null', '{"data":"invalid"}']) {
      await writeFile(
        path.join(root, '.viteval/datasets/broken.json'),
        contents
      );
      expect(await sdk.datasets.get({ id: 'broken' })).toHaveProperty('error');
    }
    await mkdir(path.join(root, '.viteval/datasets/directory.json'));
    expect(await sdk.datasets.get({ id: 'directory' })).toMatchObject({
      error: expect.stringContaining('Unable to read dataset file'),
    });
  });
  it('should preserve provider dataset identifiers containing encoded filename characters', async () => {
    const provider = createJsonProvider({ root });
    const created = await provider.datasets!.create({
      name: 'questions/first,release',
      items: [{ input: 'q', expected: 'a' }],
    });
    if (!created.ok) throw created.error;
    const tag = await provider.tags!.create({ name: 'release' });
    if (!tag.ok) throw tag.error;
    await provider.tags!.addTagging({
      tagId: tag.value.id,
      entityType: 'dataset',
      entityId: created.value.id,
    });
    const sdk = createViteval({ root });
    expect(await sdk.datasets.list()).toMatchObject({
      data: [{ id: created.value.id, name: 'questions/first,release' }],
    });
    expect(await sdk.datasets.get({ id: created.value.id })).toMatchObject({
      data: {
        id: created.value.id,
        data: [{ id: `${created.value.id}:0`, input: 'q' }],
      },
    });
    expect(
      await sdk.tags.listTaggings({
        entityType: 'dataset',
        entityId: created.value.id,
      })
    ).toMatchObject({
      data: [{ id: tag.value.id }],
    });
  });
  it('should read datasets and run history produced by the JSON provider', async () => {
    const provider = createJsonProvider({ root });
    await provider.datasets!.create({
      name: 'questions',
      items: [
        {
          input: 'hello',
          expected: 'HELLO',
          extra: { context: ['reference'] },
        },
      ],
    });
    const run = await provider.evals!.create({
      name: 'uppercase',
      config: {
        aggregation: 'sum',
        threshold: 1,
        scorerNames: ['first', 'second'],
      },
    });
    if (!run.ok) throw run.error;
    await provider.evals!.addResult({
      evalRunId: run.value.id,
      input: 'hello',
      expected: 'HELLO',
      output: 'HELLO',
      scores: [
        { name: 'first', score: 0.5 },
        { name: 'second', score: 0.5 },
      ],
      meanScore: 0.5,
      medianScore: 0.5,
      sumScore: 1,
      passed: true,
    });
    await provider.evals!.complete({
      id: run.value.id,
      summary: {
        meanScore: 0.5,
        medianScore: 0.5,
        sumScore: 1,
        passedCount: 1,
        failedCount: 0,
        totalCount: 1,
        passed: true,
      },
    });
    const sdk = createViteval({ root });
    expect(await sdk.datasets.list()).toMatchObject({
      total: 1,
      data: [{ name: 'questions', itemCount: 1 }],
    });
    expect(await sdk.datasets.get({ id: 'questions' })).toMatchObject({
      data: { data: [{ metadata: { context: ['reference'] } }] },
    });
    expect(await sdk.results.list()).toMatchObject({
      total: 1,
      data: [{ runId: run.value.id }],
    });
    const detail = await sdk.results.get({ id: run.value.id });
    if (!detail.data) throw new Error('Result was not loaded');
    expect(isEvalPassed(detail.data.evalResults[0].evalResults[0])).toBe(true);
    expect(await sdk.suites.list()).toMatchObject({
      total: 1,
      data: [{ name: 'uppercase', runCount: 1 }],
    });
  });

  it('should expose malformed files without breaking valid history', async () => {
    await mkdir(path.join(root, '.viteval', 'results'), { recursive: true });
    await mkdir(path.join(root, '.viteval', 'datasets'), { recursive: true });
    await writeFile(
      path.join(root, '.viteval', 'results', 'broken.json'),
      '{broken'
    );
    await writeFile(
      path.join(root, '.viteval', 'datasets', 'broken.json'),
      JSON.stringify({ data: 'not an array' })
    );
    const sdk = createViteval({ root });
    expect(await sdk.results.list()).toMatchObject({
      data: [],
      warnings: ['Invalid result file: broken.json'],
    });
    expect(await sdk.datasets.list()).toMatchObject({
      data: [],
      warnings: ['Invalid dataset file: broken.json'],
    });
    expect(await sdk.results.get({ id: 'broken' })).toMatchObject({
      error: 'Invalid evaluation result file: broken',
    });
    expect(await sdk.suites.list()).toMatchObject({ data: [] });
  });

  it('should preserve concurrent tagging changes across SDK instances', async () => {
    await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        createViteval({ root }).tags.create({ name: `tag-${index}` })
      )
    );
    const sdk = createViteval({ root });
    const listed = await sdk.tags.list();
    expect(listed.total).toBe(8);
    const tag = listed.data[0];
    const params = {
      tagId: tag.id,
      entityType: 'dataset' as const,
      entityId: 'questions',
    };
    await sdk.tags.addTagging(params);
    expect(
      await sdk.tags.listTaggings({
        entityType: 'dataset',
        entityId: 'questions',
      })
    ).toMatchObject({ data: [{ id: tag.id }] });
    await sdk.tags.delete({ id: tag.id });
    expect(await sdk.tags.listEntitiesForTag({ tagId: tag.id })).toMatchObject({
      data: [],
    });
  });

  it('should honor recorded execution failures over a passing numerical score', () => {
    expect(
      isEvalPassed({
        name: 'failed hook',
        aggregation: 'mean',
        mean: 1,
        median: 1,
        sum: 1,
        threshold: 0.5,
        scores: [],
        state: 'failed',
      })
    ).toBe(false);
  });

  it('should return empty collections and reject paths outside the project', async () => {
    const sdk = createViteval({ root });
    expect(await sdk.results.list()).toMatchObject({ data: [], total: 0 });
    expect(await sdk.datasets.list()).toMatchObject({ data: [], total: 0 });
    expect(await sdk.schemas.get({ id: '../outside.ts' })).toEqual({
      data: null,
    });
    expect(await sdk.results.get({ id: '../../../outside' })).toEqual({
      data: null,
    });
  });
});
