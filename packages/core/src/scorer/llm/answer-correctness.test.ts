import { describe, expect, it, vi } from 'vitest';

vi.mock('./judge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge')>();
  return { ...actual, runJudge: vi.fn() };
});

import { runJudge } from './judge';
import { answerCorrectness } from './answer-correctness';

describe('answerCorrectness', () => {
  it('should call runJudge with correctness prompt and return score', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      choice: 'A',
      rationale: 'Completely correct',
      score: 1,
    });

    const result = await answerCorrectness({
      expected: 'Paris',
      input: 'What is the capital of France?',
      output: 'Paris',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('A');
    expect(result.metadata?.rationale).toBe('Completely correct');
    expect(vi.mocked(runJudge)).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceScores: { A: 1, B: 0.5, C: 0 },
        useCoT: true,
      }),
      expect.objectContaining({
        expected: 'Paris',
        input: 'What is the capital of France?',
        output: 'Paris',
      })
    );
  });
});
