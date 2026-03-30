import { createJudgeScorer } from './create-judge-scorer';

const PROMPT = `You are evaluating the precision of a retrieved context for answering a question.

<question>
{{input}}
</question>

<context>
{{output}}
</context>

<expected_answer>
{{expected}}
</expected_answer>

Evaluate whether the context is precise and focused on information needed to answer the question correctly.
(A) The context is highly precise and contains mostly relevant information for answering the question.
(B) The context contains some relevant information but also includes unnecessary details.
(C) The context is mostly irrelevant to answering the question.`;

const CHOICE_SCORES: Record<string, number> = { A: 1, B: 0.5, C: 0 };

/**
 * Scores whether a retrieved context is precise and focused on relevant information.
 *
 * Uses an LLM judge to evaluate if the context avoids unnecessary details.
 *
 * @example
 * ```ts
 * import { contextPrecision } from '@viteval/core';
 *
 * const scorer = contextPrecision();
 * const result = await scorer({
 *   input: 'What year was Python created?',
 *   output: 'Python was created by Guido van Rossum and first released in 1991.',
 *   expected: '1991',
 * });
 * ```
 */
export const contextPrecision = createJudgeScorer({
  choiceScores: CHOICE_SCORES,
  name: 'ContextPrecision',
  prompt: PROMPT,
});
