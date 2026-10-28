import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { viteval } from './provider';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'viteval-sqlite-'));
});
afterEach(async () => {
  await rm(root, { force: true, recursive: true });
});

describe('viteval provider', () => {
  it('should support dataset CRUD, pagination, and append ordinals in real SQLite', async () => {
    const provider = viteval({ path: path.join(root, 'crud.db') });
    try {
      expect(provider.datasets).toBeUndefined();
      expect(provider.evals).toBeUndefined();
      expect(provider.tags).toBeUndefined();
      await provider.close();
      expect((await provider.initialize()).ok).toBe(true);
      expect((await provider.initialize()).ok).toBe(true);
      const datasets = provider.datasets!;
      const created = await datasets.create({
        name: 'empty',
        description: 'initial',
        metadata: { source: 'test' },
      });
      if (!created.ok) throw created.error;
      const id = created.value.id;
      // @ts-expect-error JavaScript callers can omit both selectors.
      const unselected = await datasets.get({});
      expect(unselected).toMatchObject({ ok: true, value: null });
      expect(await datasets.get({ name: 'empty' })).toMatchObject({
        ok: true,
        value: { id, description: 'initial' },
      });
      expect(
        await datasets.addItems({
          datasetId: id,
          items: [
            { input: null, expected: null, extra: { context: 'reference' } },
          ],
        })
      ).toMatchObject({ ok: true });
      expect(
        await datasets.replaceItems!({
          datasetId: id,
          items: [
            { input: null, expected: null, extra: { replaced: true } },
            { input: 2, expected: 2 },
          ],
        })
      ).toMatchObject({ ok: true });
      expect(
        await datasets.getItems({ datasetId: id, offset: 1, limit: 1 })
      ).toMatchObject({ ok: true, value: [{ input: 2, ordinal: 1 }] });
      expect(
        await datasets.update({
          id,
          name: 'renamed',
          description: 'updated',
          metadata: { revision: 2 },
        })
      ).toMatchObject({
        ok: true,
        value: { name: 'renamed', metadata: { revision: 2 } },
      });
      expect(
        await datasets.update({ id, description: 'retained' })
      ).toMatchObject({ ok: true, value: { metadata: { revision: 2 } } });
      expect(await datasets.list()).toMatchObject({
        ok: true,
        value: [{ id }],
      });
      expect(await datasets.list({ offset: 0, limit: 1 })).toMatchObject({
        ok: true,
        value: [{ id }],
      });
      expect(await datasets.list({ offset: 1, limit: 1 })).toMatchObject({
        ok: true,
        value: [],
      });
      expect(await datasets.delete({ id })).toMatchObject({ ok: true });
      expect(await datasets.get({ name: 'renamed' })).toMatchObject({
        ok: true,
        value: null,
      });
      expect(await datasets.getItems({ datasetId: id })).toMatchObject({
        ok: true,
        value: [],
      });
      expect(
        await datasets.addItems({ datasetId: id, items: [] })
      ).toMatchObject({ ok: false });
    } finally {
      await provider.close();
    }
  });

  it('should persist tag edits and enforce idempotent associations in real SQLite', async () => {
    const provider = viteval({
      database: 'sqlite',
      path: path.join(root, 'tags.db'),
    });
    try {
      expect((await provider.initialize()).ok).toBe(true);
      const tags = provider.tags!;
      const created = await tags.create({
        name: 'alpha',
        color: 'red',
        description: 'release',
      });
      if (!created.ok) throw created.error;
      const id = created.value.id;
      expect(
        await tags.update({
          id,
          name: 'beta',
          color: 'blue',
          description: 'updated',
        })
      ).toMatchObject({
        ok: true,
        value: { name: 'beta', color: 'blue', description: 'updated' },
      });
      expect(await tags.list()).toMatchObject({ ok: true, value: [{ id }] });
      expect(await tags.list({ offset: 1, limit: 1 })).toMatchObject({
        ok: true,
        value: [],
      });
      const association = {
        tagId: id,
        entityType: 'dataset' as const,
        entityId: 'dataset',
      };
      expect(await tags.addTagging(association)).toMatchObject({ ok: true });
      expect(await tags.addTagging(association)).toMatchObject({ ok: true });
      expect(await tags.listEntitiesForTag({ tagId: id })).toMatchObject({
        ok: true,
        value: [{ entityId: 'dataset' }],
      });
      expect(
        await tags.listEntitiesForTag({ tagId: id, entityType: 'eval_run' })
      ).toMatchObject({ ok: true, value: [] });
      expect(await tags.removeTagging(association)).toMatchObject({ ok: true });
      expect(
        await tags.listTaggings({ entityType: 'dataset', entityId: 'dataset' })
      ).toMatchObject({ ok: true, value: [] });
      expect(await tags.delete({ id })).toMatchObject({ ok: true });
      expect(await tags.list()).toMatchObject({ ok: true, value: [] });
    } finally {
      await provider.close();
    }
  });

  it('should filter and paginate runs and preserve batch result details in real SQLite', async () => {
    const provider = viteval({
      database: 'sqlite',
      path: path.join(root, 'history.db'),
    });
    try {
      expect((await provider.initialize()).ok).toBe(true);
      const evals = provider.evals!;
      expect(await evals.get({ id: 'missing' })).toMatchObject({
        ok: true,
        value: null,
      });
      const created = await evals.create({
        name: 'history',
        metadata: { revision: 1 },
        config: { aggregation: 'median', threshold: 0.5, scorerNames: [] },
      });
      if (!created.ok) throw created.error;
      const id = created.value.id;
      const result = {
        evalRunId: id,
        input: 'q',
        expected: 'a',
        output: 'wrong',
        duration: 25,
        metadata: { reason: 'mismatch' },
        scores: [],
        meanScore: 0,
        medianScore: 0,
        sumScore: 0,
        passed: false,
      };
      expect(await evals.addResults!([result])).toMatchObject({
        ok: true,
        value: [{ duration: 25, metadata: { reason: 'mismatch' } }],
      });
      expect(await evals.addResult(result)).toMatchObject({
        ok: true,
        value: { duration: 25 },
      });
      expect(await evals.get({ id })).toMatchObject({
        ok: true,
        value: { status: 'running' },
      });
      expect(await evals.list()).toMatchObject({ ok: true, value: [{ id }] });
      expect(
        await evals.list({ offset: 0, limit: 1, status: 'running' })
      ).toMatchObject({ ok: true, value: [{ id }] });
      expect(await evals.list({ offset: 1, limit: 1 })).toMatchObject({
        ok: true,
        value: [],
      });
      expect(
        await evals.complete({
          id,
          status: 'failed',
          summary: {
            meanScore: 0,
            medianScore: 0,
            sumScore: 0,
            passedCount: 0,
            failedCount: 2,
            totalCount: 2,
            passed: false,
          },
        })
      ).toMatchObject({ ok: true, value: { status: 'failed' } });
      expect(await evals.list({ status: 'running' })).toMatchObject({
        ok: true,
        value: [],
      });
    } finally {
      await provider.close();
    }
  });

  it('should use JSON by default', () => {
    expect(viteval().name).toBe('json');
    expect(viteval({ root }).name).toBe('json');
    expect(viteval({ database: 'sqlite' }).name).toBe('viteval');
    expect(
      viteval({ database: 'postgres', url: 'postgres://localhost/db' }).name
    ).toBe('viteval');
  });

  it('should treat unknown persisted run statuses as failed', async () => {
    const file = path.join(root, 'corrupt-status.db');
    const provider = viteval({ database: 'sqlite', path: file });
    try {
      expect((await provider.initialize()).ok).toBe(true);
      const run = await provider.evals!.create({
        name: 'corrupt',
        config: { aggregation: 'mean', threshold: 1, scorerNames: [] },
      });
      if (!run.ok) throw run.error;
      const database = new Database(file);
      try {
        database
          .prepare('UPDATE eval_runs SET status = ? WHERE id = ?')
          .run('unknown', run.value.id);
      } finally {
        database.close();
      }
      expect(await provider.evals!.get({ id: run.value.id })).toMatchObject({
        ok: true,
        value: { status: 'failed' },
      });
    } finally {
      await provider.close();
    }
  });

  it('should round-trip undefined dataset and evaluation values through SQLite as null', async () => {
    const provider = viteval({
      database: 'sqlite',
      path: path.join(root, 'void.db'),
    });
    try {
      const initialized = await provider.initialize();
      if (!initialized.ok) throw initialized.error;
      const item = { input: undefined, expected: undefined };
      const dataset = await provider.datasets!.create({
        name: 'void',
        items: [item],
      });
      if (!dataset.ok) throw dataset.error;
      expect(
        await provider.datasets!.addItems({
          datasetId: dataset.value.id,
          items: [item],
        })
      ).toMatchObject({ ok: true });
      expect(
        await provider.datasets!.getItems({ datasetId: dataset.value.id })
      ).toMatchObject({
        ok: true,
        value: [
          { input: null, expected: null },
          { input: null, expected: null },
        ],
      });
      const run = await provider.evals!.create({
        name: 'void',
        config: { aggregation: 'mean', threshold: 1, scorerNames: ['exact'] },
      });
      if (!run.ok) throw run.error;
      const result = {
        evalRunId: run.value.id,
        input: undefined,
        expected: undefined,
        output: undefined,
        scores: [{ name: 'exact', score: 1 }],
        meanScore: 1,
        medianScore: 1,
        sumScore: 1,
        passed: true,
      };
      expect(await provider.evals!.addResult(result)).toMatchObject({
        ok: true,
        value: { input: null, expected: null, output: null },
      });
      expect(await provider.evals!.addResults!([result])).toMatchObject({
        ok: true,
        value: [{ input: null, expected: null, output: null }],
      });
      await provider.close();
      const reopened = await provider.initialize();
      if (!reopened.ok) throw reopened.error;
      expect(
        await provider.evals!.get({ id: run.value.id, includeResults: true })
      ).toMatchObject({
        ok: true,
        value: {
          results: [
            { input: null, expected: null, output: null },
            { input: null, expected: null, output: null },
          ],
        },
      });
    } finally {
      await provider.close();
    }
  });

  it('should reject unsupported SQLite dataset values without losing records or incrementing their version', async () => {
    const provider = viteval({
      database: 'sqlite',
      path: path.join(root, 'atomic.db'),
    });
    try {
      const initialized = await provider.initialize();
      if (!initialized.ok) throw initialized.error;
      const dataset = await provider.datasets!.create({
        name: 'original',
        items: [{ input: 'valid', expected: 'valid' }],
      });
      if (!dataset.ok) throw dataset.error;
      for (const input of [
        NaN,
        Infinity,
        new Map([['key', 'value']]),
        () => 'unsupported',
      ]) {
        expect(
          await provider.datasets!.replaceItems!({
            datasetId: dataset.value.id,
            items: [{ input, expected: null }],
          })
        ).toMatchObject({ ok: false });
        expect(
          await provider.datasets!.addItems({
            datasetId: dataset.value.id,
            items: [{ input, expected: null }],
          })
        ).toMatchObject({ ok: false });
        expect(
          await provider.datasets!.create({
            name: 'invalid',
            items: [{ input, expected: null }],
          })
        ).toMatchObject({ ok: false });
      }
      expect(
        await provider.datasets!.update({
          id: dataset.value.id,
          metadata: { score: NaN },
        })
      ).toMatchObject({ ok: false });
      expect(
        await provider.datasets!.get({ id: dataset.value.id })
      ).toMatchObject({
        ok: true,
        value: { name: 'original', itemCount: 1, version: 1, metadata: {} },
      });
      expect(
        await provider.datasets!.getItems({ datasetId: dataset.value.id })
      ).toMatchObject({ ok: true, value: [{ input: 'valid' }] });
      expect(await provider.datasets!.get({ name: 'invalid' })).toMatchObject({
        ok: true,
        value: null,
      });
    } finally {
      await provider.close();
    }
  });

  it('should reject lossy SQLite evaluation payloads and keep batch insertion atomic', async () => {
    const provider = viteval({
      database: 'sqlite',
      path: path.join(root, 'results.db'),
    });
    try {
      const initialized = await provider.initialize();
      if (!initialized.ok) throw initialized.error;
      const run = await provider.evals!.create({
        name: 'accuracy',
        config: { aggregation: 'mean', threshold: 1, scorerNames: ['exact'] },
      });
      if (!run.ok) throw run.error;
      const result = {
        evalRunId: run.value.id,
        input: 'q',
        expected: 'a',
        output: 'a',
        scores: [{ name: 'exact', score: 1 }],
        meanScore: 1,
        medianScore: 1,
        sumScore: 1,
        passed: true,
      };
      expect(
        await provider.evals!.addResult({ ...result, metadata: { score: NaN } })
      ).toMatchObject({ ok: false });
      expect(
        await provider.evals!.addResults!([
          result,
          { ...result, output: new Set(['a']) },
        ])
      ).toMatchObject({ ok: false });
      expect(
        await provider.evals!.get({ id: run.value.id, includeResults: true })
      ).toMatchObject({ ok: true, value: { results: [] } });
      expect(await provider.evals!.addResult(result)).toMatchObject({
        ok: true,
      });
    } finally {
      await provider.close();
    }
  });

  it('should persist datasets, runs, and tags across SQLite connections', async () => {
    const options = {
      database: 'sqlite' as const,
      path: path.join(root, 'nested', 'evals.db'),
    };
    const provider = viteval(options);
    try {
      const initialized = await provider.initialize();
      expect(initialized, initialized.error?.message).toMatchObject({
        ok: true,
      });
      if (!initialized.ok) throw initialized.error;
      const dataset = await provider.datasets!.create({
        name: 'questions',
        items: [{ input: 'hello', expected: 'HELLO' }],
      });
      if (!dataset.ok) throw dataset.error;
      expect(
        (
          await provider.datasets!.replaceItems!({
            datasetId: dataset.value.id,
            items: [{ input: 'world', expected: 'WORLD' }],
          })
        ).ok
      ).toBe(true);
      const run = await provider.evals!.create({
        name: 'uppercase',
        datasetId: dataset.value.id,
        config: { aggregation: 'mean', threshold: 1, scorerNames: ['exact'] },
      });
      if (!run.ok) throw run.error;
      const added = await provider.evals!.addResult({
        evalRunId: run.value.id,
        input: 'world',
        expected: 'WORLD',
        output: 'WORLD',
        scores: [{ name: 'exact', score: 1 }],
        meanScore: 1,
        medianScore: 1,
        sumScore: 1,
        passed: true,
      });
      expect(added, added.error?.message).toMatchObject({ ok: true });
      const completed = await provider.evals!.complete({
        id: run.value.id,
        summary: {
          meanScore: 1,
          medianScore: 1,
          sumScore: 1,
          passedCount: 1,
          failedCount: 0,
          totalCount: 1,
          passed: true,
        },
      });
      expect(completed, completed.error?.message).toMatchObject({ ok: true });
      const tag = await provider.tags!.create({ name: 'release' });
      if (!tag.ok) throw tag.error;
      expect(
        (
          await provider.tags!.addTagging({
            tagId: tag.value.id,
            entityType: 'eval_run',
            entityId: run.value.id,
          })
        ).ok
      ).toBe(true);
      await provider.close();
      expect((await provider.initialize()).ok).toBe(true);
      expect(
        await provider.datasets!.getItems({ datasetId: dataset.value.id })
      ).toMatchObject({ ok: true, value: [{ input: 'world' }] });
      expect(
        await provider.evals!.get({ id: run.value.id, includeResults: true })
      ).toMatchObject({
        ok: true,
        value: { status: 'completed', results: [{ output: 'WORLD' }] },
      });
      expect(
        await provider.tags!.listTaggings({
          entityType: 'eval_run',
          entityId: run.value.id,
        })
      ).toMatchObject({ ok: true, value: [{ name: 'release' }] });
    } finally {
      await provider.close();
    }
  });
});
