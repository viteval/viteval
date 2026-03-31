import { createJudgeScorer } from './create-judge-scorer';

const PROMPT = `You are evaluating the correctness of an answer to a question.

<question>
{{input}}
</question>

<expected_answer>
{{expected}}
</expected_answer>

<submitted_answer>
{{output}}
</submitted_answer>

Evaluate whether the submitted answer is correct based on the expected answer. Consider factual accuracy and completeness.
(A) The submitted answer is completely correct and matches the expected answer.
(B) The submitted answer is partially correct but missing important details.
(C) The submitted answer is incorrect or contradicts the expected answer.`;

const CHOICE_SCORES: Record<string, number> = { A: 1, B: 0.5, C: 0 };

/**
 * Scores answer correctness by comparing a submission to an expected answer.
 *
 * Uses an LLM judge to evaluate factual accuracy and completeness.
 *
 * @example
 * ```ts
 * import { answerCorrectness } from '@viteval/core';
 *
 * const scorer = answerCorrectness();
 * const result = await scorer({
 *   input: 'What is 2+2?',
 *   output: '4',
 *   expected: '4',
 * });
 * ```
 */
export const answerCorrectness = createJudgeScorer({
  choiceScores: CHOICE_SCORES,
  name: 'AnswerCorrectness',
  prompt: PROMPT,
});
