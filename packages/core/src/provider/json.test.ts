import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EVAL_RESULTS_SCHEMA } from '#/reporters/schema';
import { createJsonProvider } from './json';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'viteval-provider-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('createJsonProvider', () => {
  it('should persist undefined dataset values as null across create, append, and replacement', async () => {
    const datasets = createJsonProvider({ root }).datasets!;
    const item = {
      input: undefined,
      expected: undefined,
      extra: { category: 'void' },
    };
    const created = await datasets.create({
      name: 'void-values',
      items: [item],
    });
    if (!created.ok) throw created.error;
    expect(
      await datasets.getItems({ datasetId: created.value.id })
    ).toMatchObject({
      ok: true,
      value: [{ input: null, expected: null, extra: { category: 'void' } }],
    });
    expect(
      await datasets.addItems({ datasetId: created.value.id, items: [item] })
    ).toMatchObject({ ok: true });
    expect(await datasets.get({ id: created.value.id })).toMatchObject({
      ok: true,
      value: { itemCount: 2, version: 2 },
    });
    expect(
      await datasets.replaceItems!({
        datasetId: created.value.id,
        items: [item],
      })
    ).toMatchObject({ ok: true });
    expect(
      await createJsonProvider({ root }).datasets!.getItems({
        datasetId: created.value.id,
      })
    ).toMatchObject({
      ok: true,
      value: [{ input: null, expected: null, extra: { category: 'void' } }],
    });
    expect(await datasets.list()).toMatchObject({
      ok: true,
      value: [{ name: 'void-values', itemCount: 1, version: 3 }],
    });
  });

  it('should preserve renamed datasets when their original name is reused', async () => {
    const datasets = createJsonProvider({ root }).datasets!;
    const original = await datasets.create({
      name: 'questions',
      items: [{ input: 'original', expected: 'answer' }],
    });
    if (!original.ok) throw original.error;
    const renamed = await datasets.update({
      id: original.value.id,
      name: 'renamed',
      description: 'Original dataset',
      metadata: { revision: 'first' },
    });
    expect(renamed).toMatchObject({
      ok: true,
      value: { id: original.value.id, name: 'renamed', version: 2 },
    });
    const replacement = await datasets.create({
      name: 'questions',
      items: [{ input: 'replacement', expected: 'new answer' }],
    });
    if (!replacement.ok) throw replacement.error;
    expect(replacement.value.id).not.toBe(original.value.id);
    expect(await datasets.get({ name: 'renamed' })).toMatchObject({
      ok: true,
      value: { id: original.value.id, metadata: { revision: 'first' } },
    });
    expect(
      await datasets.getItems({ datasetId: original.value.id })
    ).toMatchObject({
      ok: true,
      value: [{ input: 'original' }],
    });
    expect(
      await datasets.getItems({ datasetId: replacement.value.id })
    ).toMatchObject({
      ok: true,
      value: [{ input: 'replacement' }],
    });
  });

  it('should enforce unique names across concurrent creation and rename', async () => {
    const datasets = createJsonProvider({ root }).datasets!;
    const created = await datasets.create({ name: 'original' });
    if (!created.ok) throw created.error;
    const results = await Promise.all([
      datasets.update({ id: created.value.id, name: 'shared' }),
      createJsonProvider({ root }).datasets!.create({ name: 'shared' }),
    ]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    const listed = await datasets.list();
    if (!listed.ok) throw listed.error;
    expect(
      listed.value.filter((dataset) => dataset.name === 'shared')
    ).toHaveLength(1);
    expect(await datasets.get({ id: created.value.id })).toMatchObject({
      ok: true,
    });
  });

  it('should reject empty and duplicate names without modifying the dataset', async () => {
    const datasets = createJsonProvider({ root }).datasets!;
    await datasets.create({ name: 'first' });
    await datasets.create({ name: 'second' });
    for (const name of ['', '   ', 'second']) {
      expect(await datasets.update({ id: 'first', name })).toMatchObject({
        ok: false,
      });
      expect(await datasets.get({ id: 'first' })).toMatchObject({
        ok: true,
        value: { name: 'first', version: 1 },
      });
    }
    expect(await datasets.create({ name: 'first' })).toMatchObject({
      ok: false,
    });
    expect(await datasets.create({ name: ' ' })).toMatchObject({ ok: false });
  });

  it('should paginate, replace, and delete datasets without losing extra item fields', async () => {
    const datasets = createJsonProvider({ root }).datasets!;
    await datasets.create({ name: 'alpha' });
    await datasets.create({ name: 'beta' });
    expect(await datasets.list({ offset: 1, limit: 1 })).toMatchObject({
      ok: true,
      value: [{ name: 'beta' }],
    });
    expect(
      await datasets.replaceItems!({
        datasetId: 'beta',
        items: [
          { input: 'a', expected: 'A', extra: { category: 'first' } },
          { input: 'b', expected: 'B', extra: { category: 'second' } },
        ],
      })
    ).toMatchObject({ ok: true });
    expect(
      await datasets.getItems({ datasetId: 'beta', offset: 1, limit: 1 })
    ).toMatchObject({
      ok: true,
      value: [
        { id: 'beta:1', ordinal: 1, input: 'b', extra: { category: 'second' } },
      ],
    });
    expect(await datasets.get({ id: 'beta' })).toMatchObject({
      ok: true,
      value: { itemCount: 2, version: 2 },
    });
    expect(await datasets.delete({ id: 'beta' })).toMatchObject({ ok: true });
    expect(await datasets.get({ name: 'beta' })).toMatchObject({
      ok: true,
      value: null,
    });
    expect(
      await datasets.update({ id: 'beta', description: 'missing' })
    ).toMatchObject({ ok: false });
    expect(
      await datasets.addItems({ datasetId: 'beta', items: [] })
    ).toMatchObject({ ok: false });
    expect(
      await datasets.replaceItems!({ datasetId: 'beta', items: [] })
    ).toMatchObject({ ok: false });
    expect(await datasets.getItems({ datasetId: 'beta' })).toMatchObject({
      ok: false,
    });
  });

  it('should upgrade legacy tag arrays while preserving identifiers', async () => {
    await mkdir(path.join(root, '.viteval'), { recursive: true });
    await writeFile(
      path.join(root, '.viteval', 'tags.json'),
      JSON.stringify([
        {
          id: 'legacy',
          name: 'release',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ])
    );
    await writeFile(
      path.join(root, '.viteval', 'taggings.json'),
      JSON.stringify([
        {
          id: 'legacy-tagging',
          tagId: 'legacy',
          entityType: 'dataset',
          entityId: 'questions',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ])
    );
    const tags = createJsonProvider({ root }).tags!;
    expect(
      await tags.listTaggings({ entityType: 'dataset', entityId: 'questions' })
    ).toMatchObject({ ok: true, value: [{ id: 'legacy' }] });
    expect((await tags.update({ id: 'legacy', color: '#ffffff' })).ok).toBe(
      true
    );
    const file = JSON.parse(
      await readFile(path.join(root, '.viteval', 'tags.json'), 'utf8')
    );
    expect(file).toMatchObject({
      schemaVersion: 1,
      tags: [{ id: 'legacy', color: '#ffffff' }],
    });
  });
  it('should preserve concurrent dataset additions across separate instances', async () => {
    const first = createJsonProvider({ root }).datasets!;
    const created = await first.create({
      name: '../questions',
      items: [{ input: 'first', expected: 'answer' }],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) throw created.error;
    await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        createJsonProvider({ root }).datasets!.addItems({
          datasetId: created.value.id,
          items: [{ input: index, expected: index }],
        })
      ).map(async (result) => expect((await result).ok).toBe(true))
    );
    const loaded = await first.getItems({ datasetId: created.value.id });
    expect(loaded.ok && loaded.value.length).toBe(13);
    expect(await first.get({ name: '../questions' })).toMatchObject({
      ok: true,
      value: { version: 13 },
    });
  });

  it('should preserve existing data when unsupported JSON is rejected', async () => {
    const datasets = createJsonProvider({ root }).datasets!;
    await datasets.create({
      name: 'valid',
      items: [{ input: 1, expected: 1 }],
    });
    expect(
      await datasets.replaceItems!({
        datasetId: 'valid',
        items: [{ input: 1n, expected: 1 }],
      })
    ).toMatchObject({ ok: false });
    expect(await datasets.getItems({ datasetId: 'valid' })).toMatchObject({
      ok: true,
      value: [{ input: 1 }],
    });
    await writeFile(
      path.join(root, '.viteval', 'datasets', 'valid.json'),
      '{broken'
    );
    expect(await datasets.get({ id: 'valid' })).toMatchObject({ ok: false });
  });

  it('should finalize results into the dashboard JSON layout', async () => {
    const evals = createJsonProvider({ root }).evals!;
    const created = await evals.create({
      name: 'accuracy',
      config: { aggregation: 'mean', threshold: 0.8, scorerNames: ['exact'] },
    });
    if (!created.ok) throw created.error;
    const params = {
      evalRunId: created.value.id,
      input: 'hello',
      expected: 'HELLO',
      output: 'HELLO',
      scores: [{ name: 'exact', score: 1 }],
      meanScore: 1,
      medianScore: 1,
      sumScore: 1,
      passed: true,
    };
    expect((await evals.addResult(params)).ok).toBe(true);
    expect(
      (
        await evals.complete({
          id: created.value.id,
          summary: {
            meanScore: 1,
            medianScore: 1,
            sumScore: 1,
            passedCount: 1,
            failedCount: 0,
            totalCount: 1,
            passed: true,
          },
        })
      ).ok
    ).toBe(true);
    const raw = JSON.parse(
      await readFile(
        path.join(root, '.viteval', 'results', `${created.value.id}.json`),
        'utf8'
      )
    );
    expect(raw).toMatchObject({
      schemaVersion: 1,
      runId: created.value.id,
      success: true,
      status: 'finished',
      numPassedEvals: 1,
    });
    expect(await evals.addResult(params)).toMatchObject({ ok: false });
    expect(
      await createJsonProvider({ root }).evals!.get({
        id: created.value.id,
        includeResults: true,
      })
    ).toMatchObject({
      ok: true,
      value: { status: 'completed', results: [{ output: 'HELLO' }] },
    });
  });

  it('should exclude skipped native cases from provider score summaries without dropping their outcomes', async () => {
    await mkdir(path.join(root, '.viteval/results'), { recursive: true });
    const report = {
      runId: 'native-skips',
      runName: 'native skips',
      status: 'finished',
      success: true,
      numTotalEvalSuites: 1,
      numPassedEvalSuites: 1,
      numFailedEvalSuites: 0,
      numTotalEvals: 3,
      numPassedEvals: 1,
      numFailedEvals: 0,
      numSkippedEvals: 2,
      startTime: 1,
      endTime: 2,
      evalResults: [
        {
          name: 'accuracy',
          status: 'passed',
          startTime: 1,
          endTime: 2,
          duration: 1,
          summary: {
            meanScore: 1,
            medianScore: 1,
            sumScore: 1,
            passedCount: 1,
            failedCount: 0,
            skippedCount: 2,
            totalCount: 3,
          },
          evalResults: ['skipped', 'passed', 'skipped'].map((state, index) => ({
            id: `native-case-${index}`,
            name: `case ${index}`,
            state,
            aggregation: 'mean',
            threshold: 1,
            mean: state === 'passed' ? 1 : 0,
            median: state === 'passed' ? 1 : 0,
            sum: state === 'passed' ? 1 : 0,
            scores: state === 'passed' ? [{ name: 'exact', score: 1 }] : [],
          })),
        },
      ],
    };
    await writeFile(
      path.join(root, '.viteval/results/native-skips.json'),
      JSON.stringify(report)
    );
    expect(
      await createJsonProvider({ root }).evals!.get({
        id: 'native-skips',
        includeResults: true,
      })
    ).toMatchObject({
      ok: true,
      value: {
        config: { scorerNames: ['exact'] },
        summary: {
          meanScore: 1,
          medianScore: 1,
          sumScore: 1,
          passedCount: 1,
          failedCount: 0,
          totalCount: 3,
        },
        results: [
          { metadata: { state: 'skipped' } },
          { passed: true, metadata: { state: 'passed' } },
          { metadata: { state: 'skipped' } },
        ],
      },
    });
  });

  it('should retain failed outcomes when projecting provider runs for the dashboard', async () => {
    const evals = createJsonProvider({ root }).evals!;
    const created = await evals.create({
      name: 'failed run',
      datasetId: 'questions',
      config: { aggregation: 'mean', threshold: 0.8, scorerNames: ['exact'] },
    });
    if (!created.ok) throw created.error;
    const result = await evals.addResult({
      evalRunId: created.value.id,
      input: 'q',
      expected: 'a',
      output: 'a',
      scores: [{ name: 'exact', score: 1 }],
      meanScore: 1,
      medianScore: 1,
      sumScore: 1,
      passed: false,
      metadata: { name: 'failed case', executionError: 'afterEach failed' },
    });
    if (!result.ok) throw result.error;
    expect(
      await evals.complete({
        id: created.value.id,
        summary: {
          meanScore: 1,
          medianScore: 1,
          sumScore: 1,
          passedCount: 0,
          failedCount: 1,
          totalCount: 1,
          passed: false,
        },
      })
    ).toMatchObject({ ok: true });
    const report = EVAL_RESULTS_SCHEMA.parse(
      JSON.parse(
        await readFile(
          path.join(root, '.viteval', 'results', `${created.value.id}.json`),
          'utf8'
        )
      )
    );
    expect(report).toMatchObject({
      success: false,
      numPassedEvalSuites: 0,
      numFailedEvalSuites: 1,
      evalResults: [
        {
          status: 'failed',
          evalResults: [
            { id: result.value.id, state: 'failed', error: 'afterEach failed' },
          ],
        },
      ],
    });
    expect(
      await evals.list({
        datasetId: 'questions',
        status: 'completed',
        limit: 1,
      })
    ).toMatchObject({ ok: true, value: [{ id: created.value.id }] });
    expect(await evals.list({ datasetId: 'other' })).toMatchObject({
      ok: true,
      value: [],
    });
    expect(await evals.get({ id: 'missing' })).toMatchObject({
      ok: true,
      value: null,
    });
  });

  it('should leave runs intact after rejected writes and release their locks for retries', async () => {
    const evals = createJsonProvider({ root }).evals!;
    const created = await evals.create({
      name: 'atomic run',
      config: { aggregation: 'mean', threshold: 1, scorerNames: ['exact'] },
    });
    if (!created.ok) throw created.error;
    const params = {
      evalRunId: created.value.id,
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
      await evals.addResult({
        ...params,
        scores: [{ name: 'exact', score: NaN }],
      })
    ).toMatchObject({ ok: false });
    expect(
      await evals.addResult({ ...params, metadata: { unsupported: () => 1 } })
    ).toMatchObject({ ok: false });
    expect(
      await evals.get({ id: created.value.id, includeResults: true })
    ).toMatchObject({ ok: true, value: { status: 'running', results: [] } });
    expect(await evals.addResult(params)).toMatchObject({ ok: true });
    expect(
      await evals.addResult({ ...params, evalRunId: 'missing' })
    ).toMatchObject({ ok: false });
    expect(
      await evals.complete({
        id: 'missing',
        summary: {
          meanScore: 1,
          medianScore: 1,
          sumScore: 1,
          passedCount: 1,
          failedCount: 0,
          totalCount: 1,
          passed: true,
        },
      })
    ).toMatchObject({ ok: false });
  });

  it('should report filesystem failures without replacing the existing project data', async () => {
    await writeFile(path.join(root, '.viteval'), 'existing user file');
    const datasets = createJsonProvider({ root }).datasets!;
    expect(await datasets.create({ name: 'blocked' })).toMatchObject({
      ok: false,
    });
    expect(await readFile(path.join(root, '.viteval'), 'utf8')).toBe(
      'existing user file'
    );
  });

  it('should update and remove taggings independently for each entity type', async () => {
    const tags = createJsonProvider({ root }).tags!;
    const created = await tags.create({ name: 'release', color: '#ffffff' });
    if (!created.ok) throw created.error;
    expect(await tags.create({ name: 'RELEASE' })).toMatchObject({
      ok: true,
      value: { id: created.value.id },
    });
    const second = await tags.create({ name: 'another' });
    if (!second.ok) throw second.error;
    expect(
      await tags.update({ id: second.value.id, name: 'Release' })
    ).toMatchObject({ ok: false });
    expect(await tags.update({ id: 'missing', name: 'name' })).toMatchObject({
      ok: false,
    });
    expect(
      await tags.update({
        id: created.value.id,
        name: 'renamed',
        description: 'Release candidate',
      })
    ).toMatchObject({ ok: true });
    const params = { tagId: created.value.id, entityId: 'shared-id' };
    await tags.addTagging({ ...params, entityType: 'dataset' });
    await tags.addTagging({ ...params, entityType: 'eval_run' });
    await tags.removeTagging({ ...params, entityType: 'dataset' });
    expect(
      await tags.listTaggings({ entityId: 'shared-id', entityType: 'dataset' })
    ).toMatchObject({ ok: true, value: [] });
    expect(
      await tags.listEntitiesForTag({
        tagId: created.value.id,
        entityType: 'eval_run',
      })
    ).toMatchObject({ ok: true, value: [{ entityType: 'eval_run' }] });
    expect(await tags.list({ offset: 1, limit: 1 })).toMatchObject({
      ok: true,
      value: [{ name: 'renamed' }],
    });
  });

  it('should preserve tag fields when optional updates are undefined', async () => {
    const tags = createJsonProvider({ root }).tags!;
    const created = await tags.create({
      name: 'release',
      color: '#ffffff',
      description: 'Release candidate',
    });
    if (!created.ok) throw created.error;
    expect(
      await tags.update({
        id: created.value.id,
        name: undefined,
        color: undefined,
        description: undefined,
      })
    ).toEqual(created);
    expect(
      await tags.update({ id: created.value.id, description: '' })
    ).toMatchObject({
      ok: true,
      value: { name: 'release', color: '#ffffff', description: '' },
    });
    expect(await createJsonProvider({ root }).tags!.list()).toMatchObject({
      ok: true,
      value: [{ name: 'release', color: '#ffffff', description: '' }],
    });
  });

  it('should persist tags, deduplicate taggings, and clean up deleted tags', async () => {
    const tags = createJsonProvider({ root }).tags!;
    const created = await tags.create({ name: 'release' });
    if (!created.ok) throw created.error;
    const tagging = {
      tagId: created.value.id,
      entityType: 'eval_run' as const,
      entityId: 'run-one',
    };
    const added = await Promise.all([
      tags.addTagging(tagging),
      tags.addTagging(tagging),
    ]);
    expect(added[0]).toEqual(added[1]);
    expect(
      await createJsonProvider({ root }).tags!.listTaggings({
        entityType: 'eval_run',
        entityId: 'run-one',
      })
    ).toMatchObject({ ok: true, value: [{ name: 'release' }] });
    await tags.delete({ id: created.value.id });
    expect(
      await tags.listEntitiesForTag({ tagId: created.value.id })
    ).toMatchObject({ ok: true, value: [] });
    expect(await tags.addTagging(tagging)).toMatchObject({ ok: false });
  });
});
