import { describe, expect, it, vi } from 'vitest';

vi.mock('./judge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge')>();
  return { ...actual, runJudge: vi.fn() };
});

import { runJudge } from './judge';
import { contextEntityRecall } from './context-entity-recall';

describe('contextEntityRecall', () => {
  it('should call runJudge with entity recall prompt and return score', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      choice: 'A',
      rationale: 'All entities found',
      score: 1,
    });

    const result = await contextEntityRecall({
      expected: 'Bill Gates and Paul Allen',
      input: 'Who founded Microsoft?',
      output: 'Bill Gates and Paul Allen founded Microsoft in 1975.',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('A');
    expect(result.metadata?.rationale).toBe('All entities found');
    expect(vi.mocked(runJudge)).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceScores: { A: 1, B: 0.7, C: 0.3, D: 0 },
        useCoT: true,
      }),
      expect.objectContaining({
        expected: 'Bill Gates and Paul Allen',
        input: 'Who founded Microsoft?',
        output: 'Bill Gates and Paul Allen founded Microsoft in 1975.',
      })
    );
  });
});
