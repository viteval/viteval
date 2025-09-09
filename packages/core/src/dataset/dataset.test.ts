import { createFile, fileExists } from '@viteval/internal';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineDataset } from './dataset';

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
      expect(typeof dataset.load).toBe('function');
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
      vi.mocked(createFile).mockResolvedValue(true);

      const dataset = defineDataset({
        name: 'generated-dataset',
        data: async () => mockData,
      });

      const result = await dataset.load();

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

      const result = await dataset.load();

      expect(result).toEqual(existingData);
    });

    it('should overwrite existing dataset when requested', async () => {
      const newData = [{ input: 'new', expected: 'overwritten' }];

      vi.mocked(createFile).mockResolvedValue(true);

      const dataset = defineDataset({
        name: 'overwrite-dataset',
        data: async () => newData,
      });

      const result = await dataset.load({ create: true });

      expect(result).toEqual(newData);
      expect(createFile).toHaveBeenCalled();
    });
  });
});
