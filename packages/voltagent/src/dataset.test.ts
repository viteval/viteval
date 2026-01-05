import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineVoltagentDataset } from './dataset';

// Mock the provider module
vi.mock('./provider', () => ({
  createVoltagentProvider: vi.fn().mockResolvedValue({
    type: 'voltagent',
    config: { type: 'voltagent' },
    fetch: vi.fn().mockResolvedValue([
      { id: '1', input: 'q1', expected: 'a1', name: 'Question 1' },
      { id: '2', input: 'q2', expected: 'a2', name: 'Question 2' },
    ]),
    exists: vi.fn().mockResolvedValue(true),
  }),
}));

// Mock @viteval/core/dataset
vi.mock('@viteval/core/dataset', () => ({
  createDatasetStorage: vi.fn().mockReturnValue({
    exists: vi.fn().mockResolvedValue(false),
    load: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
  }),
  findRoot: vi.fn().mockResolvedValue('/mock/root'),
}));

describe('defineVoltagentDataset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a dataset with correct name', () => {
    const dataset = defineVoltagentDataset({
      name: 'test-dataset',
    });

    expect(dataset.name).toBe('test-dataset');
  });

  it('should use local storage by default', () => {
    const dataset = defineVoltagentDataset({
      name: 'test-dataset',
    });

    expect(dataset.storage).toBe('local');
  });

  it('should use memory storage when cache is none', () => {
    const dataset = defineVoltagentDataset({
      name: 'test-dataset',
      cache: 'none',
    });

    expect(dataset.storage).toBe('memory');
  });

  it('should include description when provided', () => {
    const dataset = defineVoltagentDataset({
      name: 'test-dataset',
      description: 'A test dataset for evaluation',
    });

    expect(dataset.description).toBe('A test dataset for evaluation');
  });

  it('should load items from provider', async () => {
    const dataset = defineVoltagentDataset({
      name: 'test-dataset',
      cache: 'none', // Skip caching for this test
    });

    const items = await dataset.load();

    expect(items).toHaveLength(2);
    expect(items?.[0].input).toBe('q1');
    expect(items?.[1].input).toBe('q2');
  });

  it('should check existence via provider', async () => {
    const dataset = defineVoltagentDataset({
      name: 'test-dataset',
      cache: 'none',
    });

    const exists = await dataset.exists();

    expect(exists).toBe(true);
  });

  it('should have ___viteval_type marker for dataset detection', () => {
    const dataset = defineVoltagentDataset({
      name: 'test-dataset',
    });

    // @ts-expect-error - accessing internal marker
    expect(dataset.___viteval_type).toBe('dataset');
  });

  it('should not throw when save is called (no-op)', async () => {
    const dataset = defineVoltagentDataset({
      name: 'test-dataset',
    });

    // Save should be a no-op and not throw
    await expect(dataset.save()).resolves.toBeUndefined();
  });
});
