import type { EvalResult } from '@/types';

/** Return the recorded test outcome, falling back to the configured aggregation for legacy files. */
export function isEvalPassed(result: EvalResult): boolean {
  if (result.state) return result.state === 'passed';
  if (typeof result.metadata?.passed === 'boolean')
    return result.metadata.passed;
  if (result.metadata?.executionError) return false;
  const score =
    result.aggregation === 'sum'
      ? result.sum
      : result.aggregation === 'median'
        ? result.median
        : result.mean;
  return score >= result.threshold;
}
