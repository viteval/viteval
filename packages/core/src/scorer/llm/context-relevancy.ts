import { createJudgeScorer } from './create-judge-scorer';

const PROMPT = `You are evaluating the relevancy of a retrieved context to a given question.

<question>
{{input}}
</question>

<context>
{{output}}
</context>

Evaluate whether the context contains information relevant to answering the question.
(A) The context is highly relevant and contains information needed to answer the question.
(B) The context is somewhat relevant but may not fully help in answering the question.
(C) The context is not relevant to the question.`;

const CHOICE_SCORES: Record<string, number> = { A: 1, B: 0.5, C: 0 };

/**
 * Scores whether a retrieved context is relevant to the given question.
 *
 * Uses an LLM judge to evaluate whether the context contains useful information.
 *
 * @example
 * ```ts
 * import { contextRelevancy } from '@viteval/core';
 *
 * const scorer = contextRelevancy();
 * const result = await scorer({
 *   input: 'What is photosynthesis?',
 *   output: 'Photosynthesis is the process by which plants convert sunlight into energy.',
 * });
 * ```
 */
export const contextRelevancy = createJudgeScorer({
  choiceScores: CHOICE_SCORES,
  name: 'ContextRelevancy',
  prompt: PROMPT,
});
