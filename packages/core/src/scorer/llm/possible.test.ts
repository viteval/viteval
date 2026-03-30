import { describe, expect, it, vi } from 'vitest';

vi.mock('./judge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge')>();
  return { ...actual, runJudge: vi.fn() };
});

import { runJudge } from './judge';
import { possible } from './possible';

describe('possible', () => {
  it('should call runJudge with possible prompt and return score', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      choice: 'B',
      rationale: 'Provides a solution',
      score: 1,
    });

    const result = await possible({
      input: 'How do you sort an array?',
      output: 'Use Array.prototype.sort()',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('B');
    expect(vi.mocked(runJudge)).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceScores: { A: 0, B: 1 },
        useCoT: true,
      }),
      expect.objectContaining({
        input: 'How do you sort an array?',
        output: 'Use Array.prototype.sort()',
      })
    );
  });
});
