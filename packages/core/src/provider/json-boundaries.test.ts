import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createJsonDatasets } from './json-datasets';
import { createJsonEvals } from './json-evals';
import { createJsonProvider } from './json';
import { createJsonStore } from './json-store';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'viteval-json-boundaries-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('JSON provider boundaries', () => {
  it('should reject unversioned datasets instead of inventing metadata', async () => {
    await mkdir(path.join(root, '.viteval/datasets'), { recursive: true });
    const filename = path.join(root, '.viteval/datasets/unversioned.json');
    const datasets = createJsonProvider({ root }).datasets!;
    await writeFile(
      filename,
      JSON.stringify({
        timestamp: '2026-01-01T00:00:00Z',
        data: [{ input: 'question', expected: 'answer' }],
      })
    );
    expect(await datasets.list()).toMatchObject({ ok: false });
    expect(await datasets.get({ id: 'unversioned' })).toMatchObject({
      ok: false,
    });
    expect(
      await datasets.addItems({ datasetId: 'unversioned', items: [] })
    ).toMatchObject({ ok: false });
  });

  it('should report a dataset removed between directory discovery and read', async () => {
    const store = createJsonStore(root);
    await store.write('datasets/vanished.json', {
      schemaVersion: 1,
      id: 'vanished',
      name: 'vanished',
      version: 1,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: [],
    });
    const datasets = createJsonDatasets({
      ...store,
      async read(file, schema) {
        await store.remove(file);
        return store.read(file, schema);
      },
    });
    const result = await datasets.list();
    expect(result).toMatchObject({
      ok: false,
      error: { message: 'Dataset disappeared: vanished.json' },
    });
  });

  it.each(['running', 'finished'] as const)(
    'should read empty V1 %s reports with default configuration',
    async (status) => {
      const store = createJsonStore(root);
      await store.write(
        'results/empty.json',
        createReport({ status, success: false, evalResults: [] })
      );
      const evals = createJsonEvals(store);
      expect(
        await evals.get({ id: 'run', includeResults: true })
      ).toMatchObject({
        ok: true,
        value: {
          status: status === 'running' ? 'running' : 'failed',
          config: { aggregation: 'mean', threshold: 1, scorerNames: [] },
          results: [],
          summary: { meanScore: 0, medianScore: 0, sumScore: 0 },
        },
      });
    }
  );

  it('should project V1 report outcomes without recalculating thresholds', async () => {
    const store = createJsonStore(root);
    const outcomes = [
      { aggregation: 'sum', mean: 0.2, median: 0.2, sum: 1.2, threshold: 1 },
      { aggregation: 'median', mean: 0.1, median: 0.9, sum: 1, threshold: 0.8 },
      { aggregation: 'mean', mean: 0.9, median: 0.2, sum: 1, threshold: 0.8 },
      {
        aggregation: 'mean',
        mean: 1,
        median: 1,
        sum: 1,
        threshold: 0.8,
        metadata: { executionError: 'task failed' },
      },
    ];
    await store.write(
      'results/report.json',
      createReport({
        errors: ['run error'],
        evalResults: [
          {
            name: 'suite',
            status: 'failed',
            startTime: 1,
            endTime: 2,
            duration: 1,
            message: 'suite failed',
            summary: {
              meanScore: 0,
              medianScore: 0,
              sumScore: 0,
              passedCount: 3,
              totalCount: 4,
            },
            evalResults: outcomes.map((outcome, index) => ({
              id: `case-${index}`,
              state: index === 3 ? 'failed' : 'passed',
              name: String(index),
              scores: [],
              ...outcome,
            })),
          },
        ],
      })
    );
    const result = await createJsonEvals(store).get({
      id: 'run',
      includeResults: true,
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        metadata: { errors: ['run error', 'suite failed'] },
        summary: { medianScore: 0.55 },
        results: [
          { id: 'case-0', passed: true },
          { passed: true },
          { passed: true },
          { passed: false },
        ],
      },
    });
  });

  it('should ignore a result removed during discovery and return null for missing runs', async () => {
    const store = createJsonStore(root);
    await store.write(
      'results/disappeared.json',
      createReport({ evalResults: [] })
    );
    const evals = createJsonEvals({
      ...store,
      async list(folder) {
        const files = await store.list(folder);
        for (const file of files) await store.remove(`${folder}/${file}`);
        return files;
      },
    });
    expect(await evals.get({ id: 'missing' })).toMatchObject({
      ok: true,
      value: null,
    });
    expect(await evals.list()).toMatchObject({ ok: true, value: [] });
  });

  it('should paginate stored runs newest first and filter their status', async () => {
    const evals = createJsonProvider({ root }).evals!;
    const first = await evals.create({
      name: 'first',
      datasetId: 'data',
      config: { aggregation: 'mean', threshold: 1, scorerNames: [] },
    });
    const second = await evals.create({
      name: 'second',
      config: { aggregation: 'mean', threshold: 1, scorerNames: [] },
    });
    if (!first.ok) throw first.error;
    if (!second.ok) throw second.error;
    // Persist distinct times so sort order does not depend on filesystem timing.
    const store = createJsonStore(root);
    const filename = `results/${first.value.id}.json`;
    const raw = JSON.parse(
      await readFile(path.join(root, '.viteval', filename), 'utf8')
    );
    await store.write(filename, {
      ...raw,
      providerRun: { ...raw.providerRun, startedAt: '2000-01-01T00:00:00Z' },
    });
    expect(await evals.list({ limit: 1 })).toMatchObject({
      ok: true,
      value: [{ name: 'second' }],
    });
    expect(await evals.list({ offset: 1 })).toMatchObject({
      ok: true,
      value: [{ name: 'first' }],
    });
    expect(await evals.list({ status: 'failed' })).toMatchObject({
      ok: true,
      value: [],
    });
    expect(
      await evals.addResult({
        evalRunId: first.value.id,
        input: undefined,
        expected: undefined,
        output: undefined,
        scores: [],
        meanScore: 0,
        medianScore: 0,
        sumScore: 0,
        passed: false,
      })
    ).toMatchObject({
      ok: true,
      value: { input: null, expected: null, output: null },
    });
    expect(
      await evals.complete({
        id: first.value.id,
        status: 'failed',
        summary: {
          meanScore: 0,
          medianScore: 0,
          sumScore: 0,
          passedCount: 0,
          failedCount: 1,
          totalCount: 1,
          passed: false,
        },
      })
    ).toMatchObject({ ok: true });
  });

  it('should paginate tags without an explicit offset', async () => {
    const tags = createJsonProvider({ root }).tags!;
    await tags.create({ name: 'beta' });
    await tags.create({ name: 'alpha' });
    expect(await tags.list({ limit: 1 })).toMatchObject({
      ok: true,
      value: [{ name: 'alpha' }],
    });
  });

  it('should paginate V1 datasets and items using the default offset', async () => {
    const datasets = createJsonProvider({ root }).datasets!;
    const created = await datasets.create({
      name: 'questions',
      items: [
        { input: 'first', expected: 'FIRST' },
        { input: 'second', expected: 'SECOND' },
      ],
    });
    if (!created.ok) throw created.error;
    expect(await datasets.list({ limit: 1 })).toMatchObject({
      ok: true,
      value: [{ id: created.value.id }],
    });
    expect(
      await datasets.getItems({ datasetId: created.value.id, limit: 1 })
    ).toMatchObject({ ok: true, value: [{ input: 'first' }] });
    expect(
      await datasets.update({ id: created.value.id, description: 'updated' })
    ).toMatchObject({
      ok: true,
      value: { name: 'questions', version: 2, description: 'updated' },
    });
  });

  it.each([undefined, 0, 2])(
    'should reject reporter snapshots with schema version %s',
    async (schemaVersion) => {
      const store = createJsonStore(root);
      await store.write('results/report.json', {
        ...createReport({ evalResults: [] }),
        schemaVersion,
      });
      expect(await createJsonEvals(store).get({ id: 'run' })).toMatchObject({
        ok: false,
      });
    }
  );

  it('should project run metadata and skipped results into the dashboard format', async () => {
    const evals = createJsonProvider({ root }).evals!;
    const created = await evals.create({
      name: 'metadata',
      config: { aggregation: 'mean', threshold: 1, scorerNames: [] },
      metadata: {
        projectName: 'project',
        filepath: path.join(root, 'example.eval.ts'),
        error: 'run failure',
      },
    });
    if (!created.ok) throw created.error;
    expect(
      await evals.addResult({
        evalRunId: created.value.id,
        input: 'input',
        expected: 'expected',
        output: 'output',
        scores: [],
        meanScore: 0,
        medianScore: 0,
        sumScore: 0,
        passed: false,
        metadata: { state: 'skipped', name: 'skipped case' },
      })
    ).toMatchObject({ ok: true });
    expect(await evals.get({ id: created.value.id })).toMatchObject({
      ok: true,
      value: { results: undefined },
    });
    const report = JSON.parse(
      await readFile(
        path.join(root, '.viteval/results', `${created.value.id}.json`),
        'utf8'
      )
    );
    expect(report.evalResults).toMatchObject([
      {
        projectName: 'project',
        filepath: 'example.eval.ts',
        message: 'run failure',
        summary: { failedCount: 0, skippedCount: 1 },
        evalResults: [{ name: 'skipped case', state: 'skipped' }],
      },
    ]);
  });
});

function createReport(overrides: Record<string, unknown>) {
  return {
    schemaVersion: 1,
    runId: 'run',
    runName: 'report run',
    status: 'finished',
    success: true,
    numTotalEvalSuites: 1,
    numPassedEvalSuites: 1,
    numFailedEvalSuites: 0,
    numTotalEvals: 0,
    numPassedEvals: 0,
    numFailedEvals: 0,
    numSkippedEvals: 0,
    startTime: 1,
    ...overrides,
  };
}
