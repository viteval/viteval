import { beforeEach, describe, expect, it, vi } from 'vitest';

const { MockTestRunner } = vi.hoisted(() => {
  class MockTestRunner {
    config: unknown;

    constructor(config: unknown) {
      this.config = config;
    }

    extendTaskContext(context: Record<string, unknown>) {
      return context;
    }
  }

  return { MockTestRunner };
});

vi.mock('vitest', () => ({
  TestRunner: MockTestRunner,
}));

vi.mock('#/model/client', () => ({
  getEmbeddingModel: vi.fn(),
  getModel: vi.fn(),
}));

import { getEmbeddingModel, getModel } from '#/model/client';
import VitevalRunner from './viteval-runner';

const mockGetModel = vi.mocked(getModel);
const mockGetEmbeddingModel = vi.mocked(getEmbeddingModel);

describe('VitevalRunner', () => {
  const mockConfig = { root: '/test' } as never;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should construct with a serialized config', () => {
    const runner = new VitevalRunner(mockConfig);
    expect(runner).toBeDefined();
  });

  describe('extendTaskContext', () => {
    it('should return a context with __model and __embeddingModel properties', () => {
      const runner = new VitevalRunner(mockConfig);
      const baseContext = { task: {} } as never;

      const extended = runner.extendTaskContext(baseContext);

      expect(extended).toHaveProperty('__model');
      expect(extended).toHaveProperty('__embeddingModel');
    });

    it('should use lazy getters that call getModel/getEmbeddingModel when accessed', () => {
      const runner = new VitevalRunner(mockConfig);
      const baseContext = { task: {} } as never;

      const extended = runner.extendTaskContext(baseContext);

      expect(mockGetModel).not.toHaveBeenCalled();
      expect(mockGetEmbeddingModel).not.toHaveBeenCalled();

      mockGetModel.mockReturnValue({ modelId: 'test-model' } as never);
      // Access the getter
      const _model = (extended as Record<string, unknown>).__model;

      expect(mockGetModel).toHaveBeenCalledOnce();
      expect(_model).toEqual({ modelId: 'test-model' });
    });

    it('should return null from __model getter when getModel returns null', () => {
      const runner = new VitevalRunner(mockConfig);
      const baseContext = { task: {} } as never;

      mockGetModel.mockReturnValue(null);

      const extended = runner.extendTaskContext(baseContext);
      const model = (extended as Record<string, unknown>).__model;

      expect(model).toBeNull();
    });

    it('should return the mock model from __model getter when getModel returns a model', () => {
      const runner = new VitevalRunner(mockConfig);
      const baseContext = { task: {} } as never;

      const mockModel = { modelId: 'gpt-4o' };
      mockGetModel.mockReturnValue(mockModel as never);

      const extended = runner.extendTaskContext(baseContext);
      const model = (extended as Record<string, unknown>).__model;

      expect(model).toBe(mockModel);
    });

    it('should return null from __embeddingModel getter when getEmbeddingModel returns null', () => {
      const runner = new VitevalRunner(mockConfig);
      const baseContext = { task: {} } as never;

      mockGetEmbeddingModel.mockReturnValue(null);

      const extended = runner.extendTaskContext(baseContext);
      const embeddingModel = (extended as Record<string, unknown>)
        .__embeddingModel;

      expect(embeddingModel).toBeNull();
    });

    it('should return the mock embedding model when getEmbeddingModel returns a model', () => {
      const runner = new VitevalRunner(mockConfig);
      const baseContext = { task: {} } as never;

      const mockEmbeddingModel = { modelId: 'text-embedding-3-small' };
      mockGetEmbeddingModel.mockReturnValue(mockEmbeddingModel as never);

      const extended = runner.extendTaskContext(baseContext);
      const embeddingModel = (extended as Record<string, unknown>)
        .__embeddingModel;

      expect(embeddingModel).toBe(mockEmbeddingModel);
    });
  });
});
