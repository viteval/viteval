import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Provider } from '@viteval/core';
import { createPrismaClient } from './db';
import { viteval } from './provider';

const POSTGRES_TEST_URL = process.env.VITEVAL_TEST_POSTGRES_URL;

describe.runIf(POSTGRES_TEST_URL)('PostgreSQL provider contract', () => {
  let admin: Awaited<ReturnType<typeof createPrismaClient>>;
  let database: string;
  let url: string;
  let provider: Provider;

  beforeEach(async () => {
    if (!POSTGRES_TEST_URL)
      throw new Error('VITEVAL_TEST_POSTGRES_URL is required');
    admin = await createPrismaClient({
      database: 'postgres',
      url: POSTGRES_TEST_URL,
    });
    database = `viteval_provider_test_${randomUUID().replaceAll('-', '')}`;
    await admin.$executeRawUnsafe(`CREATE DATABASE "${database}"`);
    const connection = new URL(POSTGRES_TEST_URL);
    connection.pathname = `/${database}`;
    url = connection.toString();
    provider = viteval({ database: 'postgres', url });
  });

  afterEach(async () => {
    await provider.close();
    try {
      await admin.$executeRawUnsafe(`DROP DATABASE "${database}" WITH (FORCE)`);
    } finally {
      await admin.$disconnect();
    }
  });

  it('should persist datasets, evaluation results, and tags across PostgreSQL connections', async () => {
    expect(await provider.initialize()).toMatchObject({ ok: true });
    const datasets = provider.datasets!;
    const created = await datasets.create({
      name: 'questions',
      description: 'postgres',
      metadata: { source: 'fixture' },
      items: [
        {
          input: { question: 'q' },
          expected: 'a',
          extra: { context: 'reference' },
        },
      ],
    });
    if (!created.ok) throw created.error;
    expect(
      await datasets.addItems({
        datasetId: created.value.id,
        items: [{ input: undefined, expected: undefined }],
      })
    ).toMatchObject({ ok: true });
    expect(
      await datasets.getItems({ datasetId: created.value.id })
    ).toMatchObject({
      ok: true,
      value: [
        { input: { question: 'q' }, ordinal: 0 },
        { input: null, expected: null, ordinal: 1 },
      ],
    });
    expect(
      await datasets.replaceItems!({
        datasetId: created.value.id,
        items: [{ input: 'new', expected: 'NEW' }],
      })
    ).toMatchObject({ ok: true });
    expect(
      await datasets.update({ id: created.value.id, name: 'renamed' })
    ).toMatchObject({ ok: true, value: { version: 3, name: 'renamed' } });
    const run = await provider.evals!.create({
      name: 'uppercase',
      datasetId: created.value.id,
      config: { aggregation: 'mean', threshold: 1, scorerNames: ['exact'] },
    });
    if (!run.ok) throw run.error;
    const result = {
      evalRunId: run.value.id,
      input: 'new',
      expected: 'NEW',
      output: 'NEW',
      scores: [{ name: 'exact', score: 1 }],
      meanScore: 1,
      medianScore: 1,
      sumScore: 1,
      duration: 12,
      passed: true,
    };
    expect(await provider.evals!.addResult(result)).toMatchObject({
      ok: true,
      value: { duration: 12 },
    });
    expect(await provider.evals!.addResults!([result])).toMatchObject({
      ok: true,
      value: [{ passed: true }],
    });
    expect(
      await provider.evals!.complete({
        id: run.value.id,
        summary: {
          meanScore: 1,
          medianScore: 1,
          sumScore: 2,
          passedCount: 2,
          failedCount: 0,
          totalCount: 2,
          passed: true,
        },
      })
    ).toMatchObject({ ok: true, value: { completedAt: expect.any(Date) } });
    const tag = await provider.tags!.create({ name: 'release', color: 'blue' });
    if (!tag.ok) throw tag.error;
    expect(
      await provider.tags!.addTagging({
        tagId: tag.value.id,
        entityType: 'eval_run',
        entityId: run.value.id,
      })
    ).toMatchObject({ ok: true });
    await provider.close();
    expect(await provider.initialize()).toMatchObject({ ok: true });
    expect(await provider.datasets!.get({ name: 'renamed' })).toMatchObject({
      ok: true,
      value: {
        id: created.value.id,
        metadata: { source: 'fixture' },
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
    });
    expect(
      await provider.datasets!.getItems({ datasetId: created.value.id })
    ).toMatchObject({ ok: true, value: [{ input: 'new' }] });
    expect(
      await provider.evals!.get({ id: run.value.id, includeResults: true })
    ).toMatchObject({
      ok: true,
      value: {
        status: 'completed',
        results: [{ output: 'NEW' }, { output: 'NEW' }],
      },
    });
    expect(
      await provider.tags!.listTaggings({
        entityType: 'eval_run',
        entityId: run.value.id,
      })
    ).toMatchObject({ ok: true, value: [{ name: 'release' }] });
  });

  it('should roll back invalid dataset writes and enforce PostgreSQL foreign-key cascades', async () => {
    expect(await provider.initialize()).toMatchObject({ ok: true });
    const created = await provider.datasets!.create({
      name: 'atomic',
      items: [{ input: 'original', expected: 'a' }],
    });
    if (!created.ok) throw created.error;
    expect(
      await provider.datasets!.replaceItems!({
        datasetId: created.value.id,
        items: [
          { input: 'valid', expected: 'a' },
          { input: NaN, expected: 'invalid' },
        ],
      })
    ).toMatchObject({ ok: false });
    expect(
      await provider.datasets!.get({ id: created.value.id })
    ).toMatchObject({ ok: true, value: { version: 1, itemCount: 1 } });
    expect(
      await provider.datasets!.getItems({ datasetId: created.value.id })
    ).toMatchObject({ ok: true, value: [{ input: 'original' }] });
    expect(await provider.datasets!.create({ name: 'atomic' })).toMatchObject({
      ok: false,
    });
    const run = await provider.evals!.create({
      name: 'linked',
      datasetId: created.value.id,
      config: { aggregation: 'sum', threshold: 0, scorerNames: [] },
    });
    if (!run.ok) throw run.error;
    expect(
      await provider.datasets!.delete({ id: created.value.id })
    ).toMatchObject({ ok: true });
    expect(
      await provider.datasets!.getItems({ datasetId: created.value.id })
    ).toMatchObject({ ok: true, value: [] });
    expect(await provider.evals!.get({ id: run.value.id })).toMatchObject({
      ok: true,
      value: { datasetId: undefined, status: 'running' },
    });
    const tag = await provider.tags!.create({ name: 'cascade' });
    if (!tag.ok) throw tag.error;
    await provider.tags!.addTagging({
      tagId: tag.value.id,
      entityType: 'eval_run',
      entityId: run.value.id,
    });
    expect(await provider.tags!.delete({ id: tag.value.id })).toMatchObject({
      ok: true,
    });
    expect(
      await provider.tags!.listTaggings({
        entityType: 'eval_run',
        entityId: run.value.id,
      })
    ).toMatchObject({ ok: true, value: [] });
  });

  it('should initialize a fresh database safely from concurrent provider instances', async () => {
    const other = viteval({ database: 'postgres', url });
    try {
      const initialized = await Promise.all([
        provider.initialize(),
        other.initialize(),
      ]);
      expect(initialized).toMatchObject([{ ok: true }, { ok: true }]);
      const created = await provider.datasets!.create({ name: 'shared' });
      if (!created.ok) throw created.error;
      expect(await other.datasets!.get({ id: created.value.id })).toMatchObject(
        { ok: true, value: { name: 'shared' } }
      );
    } finally {
      await other.close();
    }
  });
});
