import { describe, it, expect, vi } from 'vitest';

vi.mock('#/provider/client', () => ({
  getClient: vi.fn(),
}));

import { getClient } from '#/provider/client';
import { moderation } from './moderation';

describe('moderation', () => {
  it('should return score 1 for non-flagged content', async () => {
    const mockCreate = vi.fn().mockResolvedValueOnce({
      results: [
        {
          flagged: false,
          categories: { hate: false },
          category_scores: { hate: 0.001 },
        },
      ],
    });

    vi.mocked(getClient).mockReturnValue({
      moderations: { create: mockCreate },
    } as never);

    const result = await moderation({
      output: 'Hello world',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.flagged).toBe(false);
    expect(mockCreate).toHaveBeenCalledWith({ input: 'Hello world' });
  });

  it('should return score 0 for flagged content', async () => {
    const mockCreate = vi.fn().mockResolvedValueOnce({
      results: [
        {
          flagged: true,
          categories: { hate: true },
          category_scores: { hate: 0.99 },
        },
      ],
    });

    vi.mocked(getClient).mockReturnValue({
      moderations: { create: mockCreate },
    } as never);

    const result = await moderation({
      output: 'harmful content',
    });

    expect(result.score).toBe(0);
    expect(result.metadata?.flagged).toBe(true);
  });

  it('should throw if client is not initialized', async () => {
    vi.mocked(getClient).mockReturnValue(null as never);

    await expect(moderation({ output: 'test' })).rejects.toThrow(
      'OpenAI client not initialized.',
    );
  });
});
