import { describe, it, expect, vi } from 'vitest';

vi.mock('./judge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge')>();
  return { ...actual, runJudge: vi.fn() };
});

import { runJudge } from './judge';
import { contextPrecision } from './context-precision';

describe('contextPrecision', () => {
  it('should call runJudge with precision prompt and return score', async () => {
    vi.mocked(runJudge).mockResolvedValueOnce({
      score: 1,
      choice: 'A',
      rationale: 'Highly precise context',
    });

    const result = await contextPrecision({
      input: 'What is the capital of France?',
      output: 'France is a country in Europe. Its capital is Paris.',
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
        output: 'France is a country in Europe. Its capital is Paris.',
        expected: 'Paris',
      }),
    );
  });
});
