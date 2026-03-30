import { describe, expect, it, vi } from 'vitest';

vi.mock('./judge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge')>();
  return { ...actual, runJudge: vi.fn() };
});

import { runJudge } from './judge';
import { summary } from './summary';

describe('summary', () => {
  it('should call runJudge with summary prompt and return score', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      choice: 'B',
      rationale: 'Summary B is better',
      score: 1,
    });

    const result = await summary({
      expected: 'An animal crosses another.',
      input: 'The quick brown fox jumps over the lazy dog.',
      output: 'A fox jumps over a dog.',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('B');
    expect(result.metadata?.rationale).toBe('Summary B is better');
    expect(vi.mocked(runJudge)).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceScores: { A: 0, B: 1 },
        useCoT: true,
      }),
      expect.objectContaining({
        expected: 'An animal crosses another.',
        input: 'The quick brown fox jumps over the lazy dog.',
        output: 'A fox jumps over a dog.',
      })
    );
  });
});
