import { describe, it, expect, vi } from 'vitest';

vi.mock('./judge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge')>();
  return { ...actual, runJudge: vi.fn() };
});

import { runJudge } from './judge';
import { contextRecall } from './context-recall';

describe('contextRecall', () => {
  it('should call runJudge with recall prompt and return score', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      score: 1,
      choice: 'A',
      rationale: 'Context fully supports answer',
    });

    const result = await contextRecall({
      input: 'What is the capital of France?',
      output: 'Paris is the capital and largest city of France.',
      expected: 'Paris',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('A');
    expect(vi.mocked(runJudge)).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceScores: { A: 1.0, B: 0.5, C: 0 },
        useCoT: true,
      }),
      expect.objectContaining({
        input: 'What is the capital of France?',
        output: 'Paris is the capital and largest city of France.',
        expected: 'Paris',
      })
    );
  });
});
