import { registerEvaluation } from '#/config/evaluation';
import type { Data, Eval, InferDataOutput } from '#/types';

/**
 * Register an evaluation with the internal execution adapter.
 * @param name - The evaluation name.
 * @param options - Dataset, task, scorers, and execution options.
 * @returns Nothing; execution is owned by the Viteval runner.
 * @example
 * evaluate('support', {
 *   data: [{ input: 'hello', expected: 'hello' }],
 *   task: ({ input }) => input,
 *   scorers: [scorers.exactMatch()],
 * });
 */
export function evaluate<
  DATA extends Data,
  TASK_OUTPUT = InferDataOutput<DATA>,
>(name: string, options: Eval<DATA, TASK_OUTPUT>): void {
  registerEvaluation<DATA, TASK_OUTPUT>({ name, options });
}
