import { describe, expect, it, vi } from 'vitest';

vi.mock('#/model/client', () => ({
  requireModel: vi.fn(() => ({ ok: true, value: {} })),
}));

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

import { generateObject } from 'ai';
import { requireModel } from '#/model/client';
import { moderation } from './moderation';

describe('moderation', () => {
  it('should return score 1 for safe content', async () => {
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: { choice: 'Safe', reasons: 'Content is harmless.' },
    } as never);

    const scorer = moderation();
    const result = await scorer({
      output: 'Hello world',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('Safe');
  });

  it('should return score 0 for unsafe content', async () => {
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: { choice: 'Unsafe', reasons: 'Content contains threats.' },
    } as never);

    const scorer = moderation();
    const result = await scorer({
      output: 'harmful content',
    });

    expect(result.score).toBe(0);
    expect(result.metadata?.choice).toBe('Unsafe');
  });

  it('should return a null score if model is not initialized', async () => {
    vi.mocked(requireModel).mockReturnValueOnce({
      error: new Error(
        'Model not initialized. Call initializeModel() from a Vitest setup file.'
      ),
      ok: false,
    });

    const scorer = moderation();
    const result = await scorer({ output: 'test' });

    expect(result).toEqual(
      expect.objectContaining({
        metadata: {
          error:
            'Model not initialized. Call initializeModel() from a Vitest setup file.',
        },
        score: null,
      })
    );
  });
});
