import { describe, expect, it, vi } from 'vitest';

vi.mock('./judge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge')>();
  return { ...actual, runJudge: vi.fn() };
});

import { runJudge } from './judge';
import { contextRecall } from './context-recall';

describe('contextRecall', () => {
  it('should call runJudge with recall prompt and return score', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      choice: 'A',
      rationale: 'Context fully supports answer',
      score: 1,
    });

    const scorer = contextRecall();
    const result = await scorer({
      expected: 'Paris',
      input: 'What is the capital of France?',
      output: 'Paris is the capital and largest city of France.',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('A');
    expect(vi.mocked(runJudge)).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceScores: { A: 1, B: 0.5, C: 0 },
        useCoT: true,
      }),
      expect.objectContaining({
        expected: 'Paris',
        input: 'What is the capital of France?',
        output: 'Paris is the capital and largest city of France.',
      })
    );
  });
});
