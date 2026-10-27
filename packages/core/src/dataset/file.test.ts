import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { defineDataset } from './dataset';
import { DATASET_FILE_SCHEMA } from './file';
import { createProjectRuntime } from '#/config/runtime';

const V1_DATASET = {
  schemaVersion: 1,
  id: 'support',
  name: 'support',
  description: 'Reviewed support cases',
  version: 1,
  metadata: { reviewed: true },
  createdAt: '2026-10-26T12:00:00.000Z',
  updatedAt: '2026-10-26T12:00:00.000Z',
  data: [{ input: 'question', expected: 'answer', context: ['reference'] }],
};

describe('DATASET_FILE_SCHEMA', () => {
  it('should preserve V1 dataset metadata and case extras', () => {
    expect(DATASET_FILE_SCHEMA.parse(V1_DATASET)).toEqual(V1_DATASET);
  });

  it('should accept optional descriptions, empty datasets, and explicit null case values', () => {
    const { description: _description, ...required } = V1_DATASET;
    expect(
      DATASET_FILE_SCHEMA.safeParse({ ...required, data: [] }).success
    ).toBe(true);
    expect(
      DATASET_FILE_SCHEMA.parse({
        ...required,
        data: [{ input: null, expected: null }],
      }).data
    ).toEqual([{ input: null, expected: null }]);
  });

  it.each([
    'schemaVersion',
    'id',
    'name',
    'version',
    'metadata',
    'createdAt',
    'updatedAt',
    'data',
  ])('should reject a V1 dataset missing %s', (field) => {
    const incomplete = Object.fromEntries(
      Object.entries(V1_DATASET).filter(([key]) => key !== field)
    );
    expect(DATASET_FILE_SCHEMA.safeParse(incomplete).success).toBe(false);
  });

  it.each([
    ['unversioned data', { data: V1_DATASET.data }],
    [
      'timestamp-only data',
      { data: V1_DATASET.data, timestamp: V1_DATASET.createdAt },
    ],
    ['old timestamp field', { ...V1_DATASET, timestamp: V1_DATASET.createdAt }],
    ['unknown schema version', { ...V1_DATASET, schemaVersion: 2 }],
    ['empty id', { ...V1_DATASET, id: '' }],
    ['empty name', { ...V1_DATASET, name: '' }],
    ['zero version', { ...V1_DATASET, version: 0 }],
    ['fractional version', { ...V1_DATASET, version: 1.5 }],
    ['invalid createdAt', { ...V1_DATASET, createdAt: 'not-a-date' }],
    ['invalid updatedAt', { ...V1_DATASET, updatedAt: '2026-02-30T00:00:00Z' }],
    ['non-object metadata', { ...V1_DATASET, metadata: [] }],
    ['non-array data', { ...V1_DATASET, data: {} }],
    ['missing input', { ...V1_DATASET, data: [{ expected: 'answer' }] }],
    ['missing expected', { ...V1_DATASET, data: [{ input: 'question' }] }],
  ])('should reject %s', (_name, value) => {
    expect(DATASET_FILE_SCHEMA.safeParse(value).success).toBe(false);
  });

  it('should validate documents produced by dataset.save and preserve V1 on overwrite', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'viteval-v1-dataset-'));
    const previousRuntime = globalThis.__viteval_runtime;
    const runtime = createProjectRuntime({ root });
    globalThis.__viteval_runtime = runtime;
    try {
      const dataset = defineDataset({ name: 'support', data: V1_DATASET.data });
      expect(await dataset.save()).toMatchObject({ ok: true });
      const original = DATASET_FILE_SCHEMA.parse(
        JSON.parse(
          await readFile(
            path.join(root, '.viteval/datasets/support.json'),
            'utf8'
          )
        )
      );
      expect(original).toMatchObject({
        schemaVersion: 1,
        id: 'support',
        name: 'support',
        version: 1,
        metadata: {},
        data: V1_DATASET.data,
      });
      expect(await dataset.save({ overwrite: true })).toMatchObject({
        ok: true,
      });
      const replacement = DATASET_FILE_SCHEMA.parse(
        JSON.parse(
          await readFile(
            path.join(root, '.viteval/datasets/support.json'),
            'utf8'
          )
        )
      );
      expect(replacement).toMatchObject({
        schemaVersion: 1,
        id: original.id,
        createdAt: original.createdAt,
        version: 2,
        data: V1_DATASET.data,
      });
      expect(replacement).not.toHaveProperty('timestamp');
    } finally {
      globalThis.__viteval_runtime = previousRuntime;
      await runtime.close();
      await rm(root, { recursive: true, force: true });
    }
  });
});
