import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./embed', () => ({
  computeEmbeddingSimilarity: vi.fn(),
}));

import { computeEmbeddingSimilarity } from './embed';
import { embeddingSimilarity } from './embedding-similarity';

describe('EmbeddingSimilarity', () => {
  beforeEach(() => {
    vi.mocked(computeEmbeddingSimilarity).mockReset();
  });

  it('should return 1.0 for identical vectors', async () => {
    vi.mocked(computeEmbeddingSimilarity).mockResolvedValueOnce({
      score: 1,
      metadata: { similarity: 1 },
    });

    const result = await embeddingSimilarity({
      input: 'test',
      output: 'hello',
      expected: 'hello',
    });

    expect(result.name).toBe('EmbeddingSimilarity');
    expect(result.score).toBe(1);
    expect(result.metadata?.similarity).toBe(1);
  });

  it('should return ~0 for orthogonal vectors', async () => {
    vi.mocked(computeEmbeddingSimilarity).mockResolvedValueOnce({
      score: 0,
      metadata: { similarity: 0 },
    });

    const result = await embeddingSimilarity({
      input: 'test',
      output: 'hello',
      expected: 'world',
    });

    expect(result.name).toBe('EmbeddingSimilarity');
    expect(result.score).toBe(0);
  });

  it('should return a high score for similar vectors', async () => {
    vi.mocked(computeEmbeddingSimilarity).mockResolvedValueOnce({
      score: 0.95,
      metadata: { similarity: 0.95 },
    });

    const result = await embeddingSimilarity({
      input: 'test',
      output: 'hi',
      expected: 'hello',
    });

    expect(result.score).toBeGreaterThan(0.9);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('should clamp negative similarity to 0', async () => {
    vi.mocked(computeEmbeddingSimilarity).mockResolvedValueOnce({
      score: 0,
      metadata: { similarity: -1 },
    });

    const result = await embeddingSimilarity({
      input: 'test',
      output: 'hello',
      expected: 'goodbye',
    });

    expect(result.score).toBe(0);
    expect(result.metadata?.similarity).toBe(-1);
  });

  it('should pass output and expected to computeEmbeddingSimilarity', async () => {
    vi.mocked(computeEmbeddingSimilarity).mockResolvedValueOnce({
      score: 1,
      metadata: { similarity: 1 },
    });

    await embeddingSimilarity({
      input: 'test',
      output: 'hello',
      expected: 'world',
    });

    expect(computeEmbeddingSimilarity).toHaveBeenCalledWith('hello', 'world');
  });
});
