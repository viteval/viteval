import { describe, expect, it, vi } from 'vitest';

vi.mock('./embed', () => ({
  getEmbedding: vi.fn(),
}));

import { getEmbedding } from './embed';
import { answerSimilarity } from './answer-similarity';

describe('AnswerSimilarity', () => {
  it('should return 1.0 for identical vectors', async () => {
    vi.mocked(getEmbedding)
      .mockResolvedValueOnce([1, 0, 0])
      .mockResolvedValueOnce([1, 0, 0]);

    const result = await answerSimilarity({
      input: 'test',
      output: 'hello',
      expected: 'hello',
    });

    expect(result.name).toBe('AnswerSimilarity');
    expect(result.score).toBe(1);
    expect(result.metadata?.similarity).toBe(1);
  });

  it('should return ~0 for orthogonal vectors', async () => {
    vi.mocked(getEmbedding)
      .mockResolvedValueOnce([1, 0, 0])
      .mockResolvedValueOnce([0, 1, 0]);

    const result = await answerSimilarity({
      input: 'test',
      output: 'hello',
      expected: 'world',
    });

    expect(result.name).toBe('AnswerSimilarity');
    expect(result.score).toBeCloseTo(0, 5);
  });

  it('should return a high score for similar vectors', async () => {
    vi.mocked(getEmbedding)
      .mockResolvedValueOnce([1, 0.1, 0])
      .mockResolvedValueOnce([1, 0, 0]);

    const result = await answerSimilarity({
      input: 'test',
      output: 'hi',
      expected: 'hello',
    });

    expect(result.score).toBeGreaterThan(0.9);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('should clamp negative similarity to 0', async () => {
    vi.mocked(getEmbedding)
      .mockResolvedValueOnce([1, 0, 0])
      .mockResolvedValueOnce([-1, 0, 0]);

    const result = await answerSimilarity({
      input: 'test',
      output: 'hello',
      expected: 'goodbye',
    });

    expect(result.score).toBe(0);
    expect(result.metadata?.similarity).toBe(-1);
  });
});
