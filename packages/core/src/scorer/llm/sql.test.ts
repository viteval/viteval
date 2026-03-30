import { describe, expect, it, vi } from 'vitest';

vi.mock('./judge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge')>();
  return { ...actual, runJudge: vi.fn() };
});

import { runJudge } from './judge';
import { sql } from './sql';

describe('sql', () => {
  it('should call runJudge with sql prompt and return score', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      choice: 'Correct',
      rationale: 'Semantically equivalent queries',
      score: 1,
    });

    const scorer = sql();
    const result = await scorer({
      expected: 'SELECT * FROM users WHERE age > 30',
      input: 'Select all users older than 30',
      output: 'SELECT * FROM users WHERE age > 30',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('Correct');
    expect(result.metadata?.rationale).toBe('Semantically equivalent queries');
    expect(vi.mocked(runJudge)).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceScores: { Correct: 1, Incorrect: 0 },
        useCoT: true,
      }),
      expect.objectContaining({
        expected: 'SELECT * FROM users WHERE age > 30',
        input: 'Select all users older than 30',
        output: 'SELECT * FROM users WHERE age > 30',
      })
    );
  });
});
