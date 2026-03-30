import { describe, vi } from 'vitest';
import { createScorer } from '../scorer/custom';
import { evaluate } from './evaluate';

vi.mock('#/internals/config', () => ({
  getRuntimeConfig: () => ({
    eval: { timeout: 25_000 },
    provider: undefined,
  }),
}));

vi.mock('#/provider/initialize', () => ({
  initializeProvider: vi.fn(),
}));

describe('evaluate', () => {
  const mockTask = vi.fn(async ({ input }: { input: string }) =>
    input.toUpperCase()
  );

  const mockScorer = createScorer({
    name: 'test-scorer',
    score: ({ output, expected }) => ({
      score: output === expected ? 1 : 0,
    }),
  });

  evaluate('basic evaluation with static data', {
    data: [
      { input: 'hello', expected: 'HELLO' },
      { input: 'world', expected: 'WORLD' },
    ],
    scorers: [mockScorer],
    task: mockTask,
  });

  evaluate('threshold enforcement with mean aggregation', {
    aggregation: 'mean',
    data: [
      { input: 'pass', expected: 'PASS' },
      { input: 'also-pass', expected: 'ALSO-PASS' },
    ],
    scorers: [mockScorer],
    task: mockTask,
    threshold: 0.8,
  });

  evaluate('median aggregation', {
    aggregation: 'median',
    data: [{ input: 'test', expected: 'TEST' }],
    scorers: [mockScorer],
    task: mockTask,
  });

  evaluate('sum aggregation', {
    aggregation: 'sum',
    data: [{ input: 'test', expected: 'TEST' }],
    scorers: [mockScorer],
    task: mockTask,
  });

  evaluate('custom timeout settings', {
    data: [{ input: 'test', expected: 'test' }],
    scorers: [mockScorer],
    task: vi.fn(async ({ input }: { input: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return input;
    }),
    timeout: 5000,
  });

  evaluate('function-based data', {
    data: async () => [{ input: 'generated', expected: 'GENERATED' }],
    scorers: [mockScorer],
    task: mockTask,
  });

  evaluate('multiple scorers', {
    data: [{ input: 'test', expected: 'TEST' }],
    scorers: [
      mockScorer,
      createScorer({
        name: 'length-scorer',
        score: ({ output }) => ({
          score: output.length > 3 ? 1.0 : 0.0,
        }),
      }),
    ],
    task: mockTask,
  });
});
