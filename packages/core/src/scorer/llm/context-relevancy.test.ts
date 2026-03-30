import { describe, it, expect, vi } from 'vitest';

vi.mock('./judge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge')>();
  return { ...actual, runJudge: vi.fn() };
});

import { runJudge } from './judge';
import { contextRelevancy } from './context-relevancy';

describe('contextRelevancy', () => {
  it('should call runJudge with relevancy prompt and return score', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      score: 1,
      choice: 'A',
      rationale: 'Highly relevant context',
    });

    const result = await contextRelevancy({
      input: 'What is photosynthesis?',
      output: 'Photosynthesis is the process by which plants convert sunlight into energy.',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('A');
    expect(vi.mocked(runJudge)).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceScores: { A: 1.0, B: 0.5, C: 0 },
        useCoT: true,
      }),
      expect.objectContaining({
        input: 'What is photosynthesis?',
        output: 'Photosynthesis is the process by which plants convert sunlight into energy.',
      }),
    );
  });
});
