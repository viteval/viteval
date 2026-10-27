import { describe, expect, it } from 'vitest';
import type { EvalResult } from '@/types';
import { isEvalPassed } from './eval-status';

const result: EvalResult = {
  name: 'case',
  state: 'passed',
  aggregation: 'mean',
  mean: 0.2,
  median: 0.7,
  sum: 1.4,
  threshold: 0.5,
  scores: [],
};

describe('isEvalPassed', () => {
  it.each(['passed', 'failed', 'skipped'] as const)(
    'should use explicit %s state independently of scores and metadata',
    (state) => {
      expect(
        isEvalPassed({ ...result, state, metadata: { passed: true } })
      ).toBe(state === 'passed');
    }
  );
});
