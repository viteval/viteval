import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
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
  it('should use JSON by default', () => {
    expect(viteval().name).toBe('json');
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
