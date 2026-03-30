import { describe, expect, it, vi } from 'vitest';

vi.mock('./judge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge')>();
  return { ...actual, runJudge: vi.fn() };
});

import { runJudge } from './judge';
import { contextRelevancy } from './context-relevancy';

describe('contextRelevancy', () => {
  it('should call runJudge with relevancy prompt and return score', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      choice: 'A',
      rationale: 'Highly relevant context',
      score: 1,
    });

    const scorer = contextRelevancy();
    const result = await scorer({
      input: 'What is photosynthesis?',
      output:
        'Photosynthesis is the process by which plants convert sunlight into energy.',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('A');
    expect(vi.mocked(runJudge)).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceScores: { A: 1, B: 0.5, C: 0 },
        useCoT: true,
      }),
      expect.objectContaining({
        input: 'What is photosynthesis?',
        output:
          'Photosynthesis is the process by which plants convert sunlight into energy.',
      })
    );
  });
});
