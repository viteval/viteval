import { describe, expect, it, vi } from 'vitest';

vi.mock('./judge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge')>();
  return { ...actual, runJudge: vi.fn() };
});

import { runJudge } from './judge';
import { answerRelevancy } from './answer-relevancy';

describe('answerRelevancy', () => {
  it('should call runJudge with relevancy prompt and return score', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      choice: 'A',
      rationale: 'Highly relevant',
      score: 1,
    });

    const result = await answerRelevancy({
      input: 'What is 2+2?',
      output: '4',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('A');
    expect(result.metadata?.rationale).toBe('Highly relevant');
    expect(vi.mocked(runJudge)).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceScores: { A: 1, B: 0.5, C: 0 },
        useCoT: true,
      }),
      expect.objectContaining({
        input: 'What is 2+2?',
        output: '4',
      })
    );
  });
});
