import { describe, vi } from 'vitest';
import { createScorer } from '../scorer/custom';
import { evaluate } from './evaluate';

vi.mock('#/internals/config', () => ({
  getRuntimeConfig: () => ({
    eval: { timeout: 25_000 },
    model: undefined,
    provider: undefined,
  }),
}));

vi.mock('#/model/initialize', () => ({
  initializeModel: vi.fn(),
}));

vi.mock('#/provider/initialize', () => ({
  initializeProvider: vi.fn().mockResolvedValue(undefined),
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
      { expected: 'HELLO', input: 'hello' },
      { expected: 'WORLD', input: 'world' },
    ],
    scorers: [mockScorer],
    task: mockTask,
  });

  evaluate('threshold enforcement with mean aggregation', {
    aggregation: 'mean',
    data: [
      { expected: 'PASS', input: 'pass' },
      { expected: 'ALSO-PASS', input: 'also-pass' },
    ],
    scorers: [mockScorer],
    task: mockTask,
    threshold: 0.8,
  });

  evaluate('median aggregation', {
    aggregation: 'median',
    data: [{ expected: 'TEST', input: 'test' }],
    scorers: [mockScorer],
    task: mockTask,
  });

  evaluate('sum aggregation', {
    aggregation: 'sum',
    data: [{ expected: 'TEST', input: 'test' }],
    scorers: [mockScorer],
    task: mockTask,
  });

  evaluate('custom timeout settings', {
    data: [{ expected: 'test', input: 'test' }],
    scorers: [mockScorer],
    task: vi.fn(async ({ input }: { input: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return input;
    }),
    timeout: 5000,
  });

  evaluate('function-based data', {
    data: async () => [{ expected: 'GENERATED', input: 'generated' }],
    scorers: [mockScorer],
    task: mockTask,
  });

  evaluate('multiple scorers', {
    data: [{ expected: 'TEST', input: 'test' }],
    scorers: [
      mockScorer,
      createScorer({
        name: 'length-scorer',
        score: ({ output }) => ({
          score: output.length > 3 ? 1 : 0,
        }),
      }),
    ],
    task: mockTask,
  });

  evaluate('decoupled task output and expected types', {
    data: [
      {
        expected: { bad: 'strawberry', good: 'banana' },
        input: 'What is the best fruit?',
      },
    ],
    scorers: [
      createScorer<string, { good: string; bad: string }>({
        name: 'good-keyword',
        score: ({ output, expected }) => ({
          score: output.includes(expected.good) ? 1 : 0,
        }),
      }),
      createScorer<string, { good: string; bad: string }>({
        name: 'bad-keyword',
        score: ({ output, expected }) => ({
          score: output.includes(expected.bad) ? 0 : 1,
        }),
      }),
    ],
    task: vi.fn(
      async ({ input }: { input: string }) =>
        `The best fruit is banana, ${input}`
    ),
  });
});
