import { describe, it, expect, vi } from 'vitest';

vi.mock('./judge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge')>();
  return { ...actual, runJudge: vi.fn() };
});

import { runJudge } from './judge';
import { contextEntityRecall } from './context-entity-recall';

describe('contextEntityRecall', () => {
  it('should call runJudge with entity recall prompt and return score', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      score: 1,
      choice: 'A',
      rationale: 'All entities found',
    });

    const result = await contextEntityRecall({
      input: 'Who founded Microsoft?',
      output: 'Bill Gates and Paul Allen founded Microsoft in 1975.',
      expected: 'Bill Gates and Paul Allen',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('A');
    expect(result.metadata?.rationale).toBe('All entities found');
    expect(vi.mocked(runJudge)).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceScores: { A: 1.0, B: 0.7, C: 0.3, D: 0 },
        useCoT: true,
      }),
      expect.objectContaining({
        input: 'Who founded Microsoft?',
        output: 'Bill Gates and Paul Allen founded Microsoft in 1975.',
        expected: 'Bill Gates and Paul Allen',
      })
    );
  });
});
