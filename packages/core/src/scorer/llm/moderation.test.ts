import { describe, it, expect, vi } from 'vitest';

vi.mock('#/provider/client', () => ({
  requireModel: vi.fn(),
}));

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

import { generateObject } from 'ai';
import { moderation } from './moderation';

describe('moderation', () => {
  it('should return score 1 for safe content', async () => {
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: { reasons: 'Content is harmless.', choice: 'Safe' },
    } as never);

    const result = await moderation({
      output: 'Hello world',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('Safe');
  });

  it('should return score 0 for unsafe content', async () => {
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: { reasons: 'Content contains threats.', choice: 'Unsafe' },
    } as never);

    const result = await moderation({
      output: 'harmful content',
    });

    expect(result.score).toBe(0);
    expect(result.metadata?.choice).toBe('Unsafe');
  });

  it('should throw if provider is not initialized', async () => {
    vi.mocked(generateObject).mockRejectedValueOnce(
      new Error(
        'Provider not initialized. Configure a provider in your viteval config or call initializeProvider() first.'
      )
    );

    await expect(moderation({ output: 'test' })).rejects.toThrow(
      'Provider not initialized.'
    );
  });
});
