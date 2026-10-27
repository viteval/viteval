import type { EvalResult } from '@/types';

/** Return the recorded V1 test outcome. */
export function isEvalPassed(result: EvalResult): boolean {
  return result.state === 'passed';
}
