import { createJudgeScorer } from './create-judge-scorer';

const PROMPT = `You are comparing a submitted answer to an expert answer on a given question.

<question>
{{input}}
</question>

<expert_answer>
{{expected}}
</expert_answer>

<submitted_answer>
{{output}}
</submitted_answer>

Compare the factual content of the submitted answer with the expert answer. Ignore any differences in style, grammar, or punctuation.
The submitted answer may either be a subset or superset of the expert answer, or it may conflict with it. Determine which case applies. Answer the question by selecting one of the following options:
(A) The submitted answer is a subset of the expert answer and is fully consistent with it.
(B) The submitted answer is a superset of the expert answer and is fully consistent with it.
(C) The submitted answer contains all the same details as the expert answer.
(D) There is a disagreement between the submitted answer and the expert answer.
(E) The answers differ, but these differences don't matter from the perspective of factuality.`;

const CHOICE_SCORES: Record<string, number> = {
  A: 0.4,
  B: 0.6,
  C: 1,
  D: 0,
  E: 1,
};

/**
 * Scores factual accuracy by comparing a submission to an expert answer.
 *
 * Uses an LLM judge to classify the relationship between the submitted
 * and expert answers (subset, superset, equivalent, conflicting, or
 * immaterially different).
 *
 * @example
 * ```ts
 * import { factuality } from '@viteval/core';
 *
 * const scorer = factuality();
 * const result = await scorer({
 *   input: 'What is the capital of France?',
 *   output: 'Paris is the capital of France.',
 *   expected: 'Paris',
 * });
 * ```
 */
export const factuality = createJudgeScorer({
  choiceScores: CHOICE_SCORES,
  name: 'Factuality',
  prompt: PROMPT,
});
