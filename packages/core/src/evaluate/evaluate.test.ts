import { describe, expect, it, vi } from 'vitest';
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

  describe('basic evaluation with static data', () => {
    const testData = [
      { input: 'hello', expected: 'HELLO' },
      { input: 'world', expected: 'WORLD' },
    ];

    const result = evaluate('basic test', {
      data: testData,
      task: mockTask,
      scorers: [mockScorer],
    });

    it('should return a defined result', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('threshold enforcement with mean aggregation', () => {
    const testData = [
      { input: 'pass', expected: 'PASS' },
      { input: 'also-pass', expected: 'ALSO-PASS' },
    ];

    const result = evaluate('threshold test', {
      data: testData,
      task: mockTask,
      scorers: [mockScorer],
      threshold: 0.8,
      aggregation: 'mean',
    });

    it('should return a defined result', () => {
      expect(result).toBeDefined();
    });
  });

  describe('different aggregation types', () => {
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

    it('should return defined results', () => {
      expect(medianResult).toBeDefined();
      expect(sumResult).toBeDefined();
    });
  });

  describe('custom timeout settings', () => {
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

    it('should return a defined result', () => {
      expect(result).toBeDefined();
    });
  });

  describe('function-based data', () => {
    const dataGenerator = async () => [
      { input: 'generated', expected: 'GENERATED' },
    ];

    const result = evaluate('function data test', {
      data: dataGenerator,
      task: mockTask,
      scorers: [mockScorer],
    });

    it('should return a defined result', () => {
      expect(result).toBeDefined();
    });
  });

  describe('multiple scorers', () => {
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

    it('should return a defined result', () => {
      expect(result).toBeDefined();
    });
  });
});
