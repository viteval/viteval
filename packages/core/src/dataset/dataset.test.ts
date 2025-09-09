import { fileExists } from '@viteval/internal';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineDataset } from './dataset';

vi.mock('@viteval/internal', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    // @ts-expect-error - this is valid
    ...actual,
    createFile: vi.fn(),
    fileExists: vi.fn(),
  };
});

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
  });
});
