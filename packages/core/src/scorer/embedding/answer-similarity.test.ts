import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./embed', () => ({
  computeEmbeddingSimilarity: vi.fn(),
}));

import { computeEmbeddingSimilarity } from './embed';
import { answerSimilarity } from './answer-similarity';

describe('AnswerSimilarity', () => {
  beforeEach(() => {
    vi.mocked(computeEmbeddingSimilarity).mockReset();
  });

  it('should return 1.0 for identical vectors', async () => {
    vi.mocked(computeEmbeddingSimilarity).mockResolvedValueOnce({
      metadata: { similarity: 1 },
      score: 1,
    });

    const result = await answerSimilarity({
      expected: 'hello',
      input: 'test',
      output: 'hello',
    });

    expect(result.name).toBe('AnswerSimilarity');
    expect(result.score).toBe(1);
    expect(result.metadata?.similarity).toBe(1);
  });

  it('should return ~0 for orthogonal vectors', async () => {
    vi.mocked(computeEmbeddingSimilarity).mockResolvedValueOnce({
      metadata: { similarity: 0 },
      score: 0,
    });

    const result = await answerSimilarity({
      expected: 'world',
      input: 'test',
      output: 'hello',
    });

    expect(result.name).toBe('AnswerSimilarity');
    expect(result.score).toBe(0);
  });

  it('should return a high score for similar vectors', async () => {
    vi.mocked(computeEmbeddingSimilarity).mockResolvedValueOnce({
      metadata: { similarity: 0.95 },
      score: 0.95,
    });

    const result = await answerSimilarity({
      expected: 'hello',
      input: 'test',
      output: 'hi',
    });

    expect(result.score).toBeGreaterThan(0.9);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('should clamp negative similarity to 0', async () => {
    vi.mocked(computeEmbeddingSimilarity).mockResolvedValueOnce({
      metadata: { similarity: -1 },
      score: 0,
    });

    const result = await answerSimilarity({
      expected: 'goodbye',
      input: 'test',
      output: 'hello',
    });

    expect(result.score).toBe(0);
    expect(result.metadata?.similarity).toBe(-1);
  });

  it('should pass output and expected to computeEmbeddingSimilarity', async () => {
    vi.mocked(computeEmbeddingSimilarity).mockResolvedValueOnce({
      metadata: { similarity: 1 },
      score: 1,
    });

    await answerSimilarity({
      expected: 'world',
      input: 'test',
      output: 'hello',
    });

    expect(computeEmbeddingSimilarity).toHaveBeenCalledWith('hello', 'world');
  });
});
