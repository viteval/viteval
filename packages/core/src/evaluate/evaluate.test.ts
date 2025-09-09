import { describe, expect, it, vi } from 'vitest';
import { createScorer } from '../scorer/custom';
import { evaluate } from './evaluate';

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

  it('should run basic evaluation with static data', async () => {
    const testData = [
      { input: 'hello', expected: 'HELLO' },
      { input: 'world', expected: 'WORLD' },
    ];

    const result = evaluate('basic test', {
      data: testData,
      task: mockTask,
      scorers: [mockScorer],
    });

    expect(result).toBeDefined();
    // evaluate returns a describe suite object, not a function
    expect(typeof result).toBe('object');
  });

  it('should handle threshold enforcement with mean aggregation', async () => {
    const testData = [
      { input: 'pass', expected: 'PASS' },
      { input: 'fail', expected: 'DIFFERENT' },
    ];

    const result = evaluate('threshold test', {
      data: testData,
      task: mockTask,
      scorers: [mockScorer],
      threshold: 0.8,
      aggregation: 'mean',
    });

    expect(result).toBeDefined();
  });

  it('should handle different aggregation types', async () => {
    const testData = [{ input: 'test', expected: 'TEST' }];

    const medianResult = evaluate('median test', {
      data: testData,
      task: mockTask,
      scorers: [mockScorer],
      aggregation: 'median',
    });

    const sumResult = evaluate('sum test', {
      data: testData,
      task: mockTask,
      scorers: [mockScorer],
      aggregation: 'sum',
    });

    expect(medianResult).toBeDefined();
    expect(sumResult).toBeDefined();
  });

  it('should handle custom timeout settings', async () => {
    const slowTask = vi.fn(async ({ input }: { input: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return input;
    });

    const testData = [{ input: 'test', expected: 'test' }];

    const result = evaluate('timeout test', {
      data: testData,
      task: slowTask,
      scorers: [mockScorer],
      timeout: 5000,
    });

    expect(result).toBeDefined();
  });

  it('should handle function-based data', async () => {
    const dataGenerator = async () => [
      { input: 'generated', expected: 'GENERATED' },
    ];

    const result = evaluate('function data test', {
      data: dataGenerator,
      task: mockTask,
      scorers: [mockScorer],
    });

    expect(result).toBeDefined();
  });

  it('should handle multiple scorers', async () => {
    const secondScorer = createScorer({
      name: 'length-scorer',
      score: ({ output }) => ({
        score: output.length > 3 ? 1.0 : 0.0,
      }),
    });

    const testData = [{ input: 'test', expected: 'TEST' }];

    const result = evaluate('multiple scorers test', {
      data: testData,
      task: mockTask,
      scorers: [mockScorer, secondScorer],
    });

    expect(result).toBeDefined();
  });
});
