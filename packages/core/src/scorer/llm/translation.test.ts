import { describe, it, expect, vi } from 'vitest';

vi.mock('./judge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge')>();
  return { ...actual, runJudge: vi.fn() };
});

import { runJudge } from './judge';
import { translation } from './translation';

describe('translation', () => {
  it('should call runJudge with translation prompt and return score', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      score: 1,
      choice: 'Y',
      rationale: 'Translations match',
    });

    const result = await translation({
      input: 'Bonjour le monde',
      output: 'Hello world',
      expected: 'Hello world',
      language: 'French',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('Y');
    expect(vi.mocked(runJudge)).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceScores: { Y: 1.0, N: 0.0 },
        useCoT: true,
      }),
      expect.objectContaining({
        input: 'Bonjour le monde',
        output: 'Hello world',
        expected: 'Hello world',
        language: 'French',
      }),
    );
  });

  it('should default language to Unknown when not provided', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      score: 0,
      choice: 'N',
      rationale: 'Different meaning',
    });

    await translation({
      input: 'Hola mundo',
      output: 'Goodbye world',
      expected: 'Hello world',
    });

    expect(vi.mocked(runJudge)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        language: 'Unknown',
      }),
    );
  });
});
