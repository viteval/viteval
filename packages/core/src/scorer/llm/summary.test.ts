import { describe, it, expect, vi } from 'vitest';

vi.mock('./judge', () => ({
  runJudge: vi.fn(),
}));

import { runJudge } from './judge';
import { summary } from './summary';

describe('summary', () => {
  it('should call runJudge with summary prompt and return score', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      score: 1,
      choice: 'B',
      rationale: 'Summary B is better',
    });

    const result = await summary({
      input: 'The quick brown fox jumps over the lazy dog.',
      output: 'A fox jumps over a dog.',
      expected: 'An animal crosses another.',
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
        input: 'The quick brown fox jumps over the lazy dog.',
        output: 'A fox jumps over a dog.',
        expected: 'An animal crosses another.',
      }),
    );
  });
});
