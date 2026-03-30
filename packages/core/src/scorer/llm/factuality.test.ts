import { describe, expect, it, vi } from 'vitest';

vi.mock('./judge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge')>();
  return { ...actual, runJudge: vi.fn() };
});

import { runJudge } from './judge';
import { factuality } from './factuality';

describe('factuality', () => {
  it('should call runJudge with factuality prompt and return score', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      choice: 'C',
      rationale: 'Answers match',
      score: 1,
    });

    const scorer = factuality();
    const result = await scorer({
      expected: '4',
      input: 'What is 2+2?',
      output: '4',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('C');
    expect(result.metadata?.rationale).toBe('Answers match');
    expect(vi.mocked(runJudge)).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceScores: { A: 0.4, B: 0.6, C: 1, D: 0, E: 1 },
        useCoT: true,
      }),
      expect.objectContaining({
        expected: '4',
        input: 'What is 2+2?',
        output: '4',
      })
    );
  });
});
