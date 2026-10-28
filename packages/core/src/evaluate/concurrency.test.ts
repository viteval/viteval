import { describe, expect, it } from 'vitest';
import { evaluate } from './evaluate';

describe('evaluation case concurrency', () => {
  let active = 0;
  let peak = 0;
  let completed = 0;
  evaluate('bounded parallel tasks', {
    concurrency: 2,
    data: Array.from({ length: 8 }, (_, input) => ({ input, expected: input })),
    task: async ({ input }) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active--;
      completed++;
      return input;
    },
    scorers: [
      ({ output, expected }) => ({
        name: 'equal',
        score: output === expected ? 1 : 0,
      }),
    ],
  });
  it('should drain queued cases without exceeding the configured permit budget', () => {
    expect(peak).toBe(2);
    expect(active).toBe(0);
    expect(completed).toBe(8);
  });
});
