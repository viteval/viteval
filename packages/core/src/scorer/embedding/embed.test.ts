import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MockEmbeddingModelV4 } from 'ai/test';

const { embed } = vi.hoisted(() => ({ embed: vi.fn() }));
vi.mock('ai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ai')>()),
  embed,
}));

import { answerSimilarity } from './answer-similarity';
import { embeddingSimilarity } from './embedding-similarity';
import { computeEmbeddingSimilarity, getEmbedding } from './embed';

describe('embedding orchestration', () => {
  const model = new MockEmbeddingModelV4();
  beforeEach(() => {
    embed.mockReset();
  });

  it('should resolve explicit models and return the generated vector', async () => {
    embed.mockResolvedValue({ embedding: [1, 0] });
    expect(await getEmbedding('hello', { model })).toMatchObject({
      ok: true,
      value: [1, 0],
    });
    expect(embed).toHaveBeenCalledWith({ model, value: 'hello' });
  });

  it('should return model resolution failures without calling the SDK', async () => {
    const result = await getEmbedding('hello', { model: 'missing:model' });
    expect(result.ok).toBe(false);
    expect(embed).not.toHaveBeenCalled();
  });

  it('should return missing default model errors', async () => {
    const result = await getEmbedding('hello');
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected an embedding configuration failure');
    }
    expect(result.error.message).toContain('Embedding model not configured');
    expect(embed).not.toHaveBeenCalled();
  });

  it('should skip model calls for equal string representations', async () => {
    expect(await computeEmbeddingSimilarity(42, '42')).toEqual({
      score: 1,
      metadata: { similarity: 1 },
    });
    expect(embed).not.toHaveBeenCalled();
  });

  it.each([embeddingSimilarity, answerSimilarity])(
    'should validate explicit models before short-circuiting matching strings',
    async (factory) => {
      expect(
        await factory({ model: 'missing:model' })({
          output: 'same',
          expected: 'same',
        })
      ).toMatchObject({ score: null, metadata: { similarity: 0 } });
      expect(
        await computeEmbeddingSimilarity('same', 'same', { model })
      ).toEqual({
        score: 1,
        metadata: { similarity: 1 },
      });
      expect(embed).not.toHaveBeenCalled();
    }
  );

  it.each([
    { first: [1, 0], second: [1, 0], similarity: 1, score: 1 },
    { first: [1, 0], second: [0, 1], similarity: 0, score: 0 },
    { first: [1, 0], second: [-1, 0], similarity: -1, score: 0 },
    { first: [], second: [], similarity: 0, score: 0 },
  ])(
    'should score embedding vectors $first and $second',
    async ({ first, second, similarity, score }) => {
      embed
        .mockResolvedValueOnce({ embedding: first })
        .mockResolvedValueOnce({ embedding: second });
      expect(
        await computeEmbeddingSimilarity('first', 'second', { model })
      ).toEqual({ score, metadata: { similarity } });
    }
  );

  it.each([0, 1])(
    'should preserve the failure of embedding %s',
    async (failedIndex) => {
      embed.mockImplementation(({ value }: { value: string }) => {
        if (value === ['first', 'second'][failedIndex])
          throw new Error('provider unavailable');
        return { embedding: [1, 0] };
      });
      expect(
        await computeEmbeddingSimilarity('first', 'second', { model })
      ).toEqual({
        score: null,
        metadata: { error: 'provider unavailable', similarity: 0 },
      });
    }
  );

  it.each([embeddingSimilarity, answerSimilarity])(
    'should use the model override through the scorer factory',
    async (factory) => {
      embed.mockResolvedValue({ embedding: [1, 0] });
      const result = await factory({ model })({
        output: 'first',
        expected: 'second',
      });
      expect(result.score).toBe(1);
      expect(embed).toHaveBeenCalledWith({ model, value: 'first' });
    }
  );
});
