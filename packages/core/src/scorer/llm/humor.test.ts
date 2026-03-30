import { describe, it, expect, vi } from 'vitest';

vi.mock('./judge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge')>();
  return { ...actual, runJudge: vi.fn() };
});

import { runJudge } from './judge';
import { humor } from './humor';

describe('humor', () => {
  it('should call runJudge with humor prompt and return score', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      score: 1,
      choice: 'Yes',
    });

    const result = await humor({
      output: 'Why did the chicken cross the road? To get to the other side!',
    });

    expect(result.score).toBe(1);
    expect(result.metadata?.choice).toBe('Yes');
    expect(vi.mocked(runJudge)).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceScores: { Yes: 1.0, No: 0.0, Unsure: 0.5 },
        useCoT: false,
      }),
      expect.objectContaining({
        output: 'Why did the chicken cross the road? To get to the other side!',
      })
    );
  });
});
