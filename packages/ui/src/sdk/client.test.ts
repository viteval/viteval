import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createJsonProvider } from '@viteval/core/provider';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isEvalPassed } from '@/lib/eval-status';
import { createViteval } from './client';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'viteval-ui-sdk-'));
});
afterEach(async () => {
  await rm(root, { force: true, recursive: true });
});

describe('dashboard storage', () => {
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
