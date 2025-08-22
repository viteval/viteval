import { createFile, fileExists } from '@viteval/internal';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineDataset, loadDataset, saveDataset } from './dataset';

vi.mock('@viteval/internal', () => ({
  createFile: vi.fn(),
  fileExists: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

vi.mock('../internals/utils', () => ({
  findRoot: vi.fn().mockResolvedValue('/mock/root'),
}));

describe('dataset functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('defineDataset', () => {
    it('should create dataset with static data generator', async () => {
      const mockData = [
        { input: 'test1', expected: 'result1' },
        { input: 'test2', expected: 'result2' },
      ];

      const dataset = defineDataset({
        name: 'test-dataset',
        data: async () => mockData,
      });

      expect(dataset.name).toBe('test-dataset');
      expect(dataset.storage).toBe('local');
      expect(typeof dataset.data).toBe('function');
    });

    it('should use custom storage type', () => {
      const dataset = defineDataset({
        name: 'memory-dataset',
        storage: 'memory',
        data: async () => [{ input: 'test', expected: 'result' }],
      });

      expect(dataset.storage).toBe('memory');
    });

    it('should handle dataset data generation', async () => {
      const mockData = [{ input: 'generated', expected: 'output' }];

      vi.mocked(fileExists).mockResolvedValue(false);
      vi.mocked(createFile).mockResolvedValue({
        status: 'created',
        // @ts-expect-error - data is of type unknown
        data: undefined,
      });

      const dataset = defineDataset({
        name: 'generated-dataset',
        data: async () => mockData,
      });

      const result = await dataset.data();

      expect(result).toEqual(mockData);
      expect(createFile).toHaveBeenCalledWith(
        '/mock/root/.viteval/datasets/generated-dataset.json',
        expect.stringContaining('"data"')
      );
    });

    it('should load existing dataset when not overwriting', async () => {
      const existingData = [{ input: 'existing', expected: 'data' }];

      vi.mocked(fileExists).mockResolvedValue(true);
      const mockReadFile = await import('node:fs/promises');
      vi.mocked(mockReadFile.readFile).mockResolvedValue(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          data: existingData,
        })
      );

      const dataset = defineDataset({
        name: 'existing-dataset',
        data: async () => [{ input: 'new', expected: 'data' }],
      });

      const result = await dataset.data();

      expect(result).toEqual(existingData);
    });

    it('should overwrite existing dataset when requested', async () => {
      const newData = [{ input: 'new', expected: 'overwritten' }];

      vi.mocked(createFile).mockResolvedValue({
        status: 'created',
        // @ts-expect-error - data is of type unknown
        data: undefined,
      });

      const dataset = defineDataset({
        name: 'overwrite-dataset',
        data: async () => newData,
      });

      const result = await dataset.data({ overwrite: true });

      expect(result).toEqual(newData);
      expect(createFile).toHaveBeenCalled();
    });
  });

  describe('saveDataset', () => {
    it('should save dataset to local storage', async () => {
      const testData = [{ input: 'save', expected: 'test' }];

      vi.mocked(createFile).mockResolvedValue({
        status: 'created',
        // @ts-expect-error - data is of type unknown
        data: undefined,
      });

      await saveDataset({
        name: 'save-test',
        storage: 'local',
        data: testData,
      });

      expect(createFile).toHaveBeenCalledWith(
        expect.stringContaining('save-test.json'),
        expect.stringContaining('"data"')
      );
    });

    it('should throw error for unsupported storage type', async () => {
      const testData = [{ input: 'test', expected: 'data' }];

      await expect(
        saveDataset({
          name: 'test',
          // @ts-expect-error - testing invalid storage type
          storage: 'unsupported',
          data: testData,
        })
      ).rejects.toThrow('Unsupported storage type: unsupported');
    });
  });

  describe('loadDataset', () => {
    it('should load dataset from local storage', async () => {
      const testData = [{ input: 'load', expected: 'test' }];

      vi.mocked(fileExists).mockResolvedValue(true);
      const mockReadFile = await import('node:fs/promises');
      vi.mocked(mockReadFile.readFile).mockResolvedValue(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          data: testData,
        })
      );

      const result = await loadDataset({
        name: 'load-test',
        storage: 'local',
      });

      expect(result).toEqual(testData);
    });

    it('should return null when dataset does not exist', async () => {
      vi.mocked(fileExists).mockResolvedValue(false);

      const result = await loadDataset({
        name: 'nonexistent',
        storage: 'local',
      });

      expect(result).toBeNull();
    });

    it('should throw error for unsupported storage type', async () => {
      await expect(
        loadDataset({
          name: 'test',
          // @ts-expect-error - testing invalid storage type
          storage: 'unsupported',
        })
      ).rejects.toThrow('Unsupported storage type: unsupported');
    });
  });
});
