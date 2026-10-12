import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createJsonProvider } from '#/provider/json';
import { defineDataset } from './dataset';

let root: string;

describe('dataset functionality', () => {
  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'viteval-datasets-'));
    globalThis.__viteval_datasetProvider = createJsonProvider({
      root,
    }).datasets;
  });
  afterEach(async () => {
    globalThis.__viteval_datasetProvider = undefined;
    await rm(root, { recursive: true, force: true });
  });

  describe('defineDataset', () => {
    it('should create dataset with static data generator', async () => {
      const mockData = [
        { expected: 'result1', input: 'test1' },
        { expected: 'result2', input: 'test2' },
      ];

      const dataset = defineDataset({
        data: async () => mockData,
        name: 'test-dataset',
      });

      expect(dataset.name).toBe('test-dataset');
      expect(dataset.storage).toBe('local');
      expect(typeof dataset.load).toBe('function');
    });

    it('should use custom storage type', () => {
      const dataset = defineDataset({
        data: async () => [{ expected: 'result', input: 'test' }],
        name: 'memory-dataset',
        storage: 'memory',
      });

      expect(dataset.storage).toBe('memory');
    });

    it('should load existing dataset when not overwriting', async () => {
      const existingData = [{ expected: 'data', input: 'existing' }];

      await mkdir(path.join(root, '.viteval', 'datasets'), { recursive: true });
      await writeFile(
        path.join(root, '.viteval', 'datasets', 'existing-dataset.json'),
        JSON.stringify({
          data: existingData,
          timestamp: new Date().toISOString(),
        })
      );

      const dataset = defineDataset({
        data: async () => [{ expected: 'data', input: 'new' }],
        name: 'existing-dataset',
      });

      const result = await dataset.load();

      expect(result).toEqual({ error: null, ok: true, value: existingData });
    });

    it('should preserve extras and replace saved items without changing identity', async () => {
      let input = 'first';
      const dataset = defineDataset({
        name: 'roundtrip',
        data: async () => [{ input, expected: input, context: ['reference'] }],
      });
      expect((await dataset.save()).ok).toBe(true);
      input = 'second';
      expect((await dataset.save({ overwrite: true })).ok).toBe(true);
      expect(await dataset.load()).toMatchObject({
        ok: true,
        value: [
          { input: 'second', expected: 'second', context: ['reference'] },
        ],
      });
      const raw = JSON.parse(
        await readFile(
          path.join(root, '.viteval', 'datasets', 'roundtrip.json'),
          'utf8'
        )
      );
      expect(raw).toMatchObject({
        id: 'roundtrip',
        schemaVersion: 1,
        version: 2,
      });
    });

    it('should retain a saved dataset when replacement generation fails', async () => {
      const original = defineDataset({
        name: 'retained',
        data: async () => [{ input: 'original', expected: 'answer' }],
      });
      await original.save();
      const failing = defineDataset({
        name: 'retained',
        data: async () => {
          throw new Error('generation failed');
        },
      });
      expect(await failing.save({ overwrite: true })).toMatchObject({
        ok: false,
      });
      expect(await original.load()).toMatchObject({
        ok: true,
        value: [{ input: 'original' }],
      });
    });
  });
});
