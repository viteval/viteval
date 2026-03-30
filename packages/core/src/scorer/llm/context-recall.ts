import { createJudgeScorer } from './create-judge-scorer';

const PROMPT = `You are evaluating the recall of a retrieved context against an expected answer.

<question>
{{input}}
</question>

<context>
{{output}}
</context>

<expected_answer>
{{expected}}
</expected_answer>

Evaluate whether the context contains enough information to support the expected answer. Consider if all claims in the expected answer can be attributed to the context.
(A) The context fully supports the expected answer - all claims can be attributed to the context.
(B) The context partially supports the expected answer - some claims can be attributed to the context.
(C) The context does not support the expected answer - few or no claims can be attributed to the context.`;

const CHOICE_SCORES: Record<string, number> = { A: 1.0, B: 0.5, C: 0 };

/**
 * Scores whether a retrieved context contains enough information to support the expected answer.
 *
 * Uses an LLM judge to check if all claims in the expected answer can be attributed to the context.
 *
 * @example
 * ```ts
 * import { contextRecall } from '@viteval/core';
 *
 * const result = await contextRecall({
 *   input: 'What year was Python created?',
 *   output: 'Python was first released in 1991 by Guido van Rossum.',
 *   expected: '1991',
 * });
 * ```
 */
export const contextRecall = createJudgeScorer({
  name: 'ContextRecall',
  prompt: PROMPT,
  choiceScores: CHOICE_SCORES,
});
