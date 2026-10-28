import { describe, expect, it, vi } from 'vitest';

vi.mock('#/model/client', () => ({
  resolveLanguageModel: vi.fn(() => ({ ok: true, value: {} })),
}));

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

import { generateObject } from 'ai';
import { resolveLanguageModel } from '#/model/client';
import { moderation } from './moderation';

describe('moderation', () => {
  it('should return score 1 for safe content', async () => {
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: { choice: 'Safe', reasons: 'Content is harmless.' },
    } as never);

    const scorer = moderation(),
      result = await scorer({
        output: 'Hello world',
      });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('Safe');
  });

  it('should return score 0 for unsafe content', async () => {
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: { choice: 'Unsafe', reasons: 'Content contains threats.' },
    } as never);

    const scorer = moderation(),
      result = await scorer({
        output: 'harmful content',
      });

    expect(result.score).toBe(0);
    expect(result.metadata?.choice).toBe('Unsafe');
  });

  it('should return a null score if model is not initialized', async () => {
    vi.mocked(resolveLanguageModel).mockReturnValueOnce({
      error: new Error(
        'Language model not configured. Set models.defaults.language in viteval.config.ts.'
      ),
      ok: false,
    });

    const scorer = moderation(),
      result = await scorer({ output: 'test' });

    expect(result).toEqual(
      expect.objectContaining({
        metadata: {
          error:
            'Language model not configured. Set models.defaults.language in viteval.config.ts.',
        },
        score: null,
      })
    );
  });
});
