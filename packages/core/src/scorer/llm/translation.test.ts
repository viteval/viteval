import { describe, expect, it, vi } from 'vitest';

vi.mock('./judge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge')>();
  return { ...actual, runJudge: vi.fn() };
});

import { runJudge } from './judge';
import { translation } from './translation';

describe('translation', () => {
  it('should call runJudge with translation prompt and return score', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      choice: 'Y',
      rationale: 'Translations match',
      score: 1,
    });

    const scorer = translation();
    const result = await scorer({
      expected: 'Hello world',
      input: 'Bonjour le monde',
      language: 'French',
      output: 'Hello world',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('Y');
    expect(vi.mocked(runJudge)).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceScores: { N: 0, Y: 1 },
        useCoT: true,
      }),
      expect.objectContaining({
        expected: 'Hello world',
        input: 'Bonjour le monde',
        language: 'French',
        output: 'Hello world',
      })
    );
  });

  it('should default language to Unknown when not provided', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      choice: 'N',
      rationale: 'Different meaning',
      score: 0,
    });

    const scorer = translation();
    await scorer({
      expected: 'Hello world',
      input: 'Hola mundo',
      output: 'Goodbye world',
    });

    expect(vi.mocked(runJudge)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        language: 'Unknown',
      })
    );
  });
});
