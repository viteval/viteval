import { describe, vi } from 'vitest';
import { createScorer } from '../scorer/custom';
import { evaluate } from './evaluate';

vi.mock('#/internals/config', () => ({
  getRuntimeConfig: () => ({
    eval: { timeout: 25000 },
    provider: undefined,
  }),
}));

vi.mock('#/provider/initialize', () => ({
  initializeProvider: vi.fn(),
}));

describe('evaluate', () => {
  const mockTask = vi.fn(async ({ input }: { input: string }) => {
    return input.toUpperCase();
  });

  const mockScorer = createScorer({
    name: 'test-scorer',
    score: ({ output, expected }) => ({
      score: output === expected ? 1.0 : 0.0,
    }),
  });

  evaluate('basic evaluation with static data', {
    data: [
      { input: 'hello', expected: 'HELLO' },
      { input: 'world', expected: 'WORLD' },
    ],
    task: mockTask,
    scorers: [mockScorer],
  });

  evaluate('threshold enforcement with mean aggregation', {
    data: [
      { input: 'pass', expected: 'PASS' },
      { input: 'also-pass', expected: 'ALSO-PASS' },
    ],
    task: mockTask,
    scorers: [mockScorer],
    threshold: 0.8,
    aggregation: 'mean',
  });

  evaluate('median aggregation', {
    data: [{ input: 'test', expected: 'TEST' }],
    task: mockTask,
    scorers: [mockScorer],
    aggregation: 'median',
  });

  evaluate('sum aggregation', {
    data: [{ input: 'test', expected: 'TEST' }],
    task: mockTask,
    scorers: [mockScorer],
    aggregation: 'sum',
  });

  evaluate('custom timeout settings', {
    data: [{ input: 'test', expected: 'test' }],
    task: vi.fn(async ({ input }: { input: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return input;
    }),
    scorers: [mockScorer],
    timeout: 5000,
  });

  evaluate('function-based data', {
    data: async () => [{ input: 'generated', expected: 'GENERATED' }],
    task: mockTask,
    scorers: [mockScorer],
  });

  evaluate('multiple scorers', {
    data: [{ input: 'test', expected: 'TEST' }],
    task: mockTask,
    scorers: [
      mockScorer,
      createScorer({
        name: 'length-scorer',
        score: ({ output }) => ({
          score: output.length > 3 ? 1.0 : 0.0,
        }),
      }),
    ],
  });
});
