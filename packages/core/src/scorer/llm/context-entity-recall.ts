import { createJudgeScorer } from './create-judge-scorer';

const PROMPT = `You are evaluating entity recall from a given context against an expected answer.

<question>
{{input}}
</question>

<context>
{{output}}
</context>

<expected_answer>
{{expected}}
</expected_answer>

Evaluate what fraction of the important entities in the expected answer are present in the context. Consider named entities, key concepts, and important terms.
(A) All important entities from the expected answer are found in the context.
(B) Most important entities from the expected answer are found in the context.
(C) Some important entities from the expected answer are found in the context.
(D) Few or no important entities from the expected answer are found in the context.`;

const CHOICE_SCORES: Record<string, number> = { A: 1, B: 0.7, C: 0.3, D: 0 };

/**
 * Scores what fraction of important entities from the expected answer appear in the context.
 *
 * Uses an LLM judge to evaluate named entities, key concepts, and important terms.
 *
 * @example
 * ```ts
 * import { contextEntityRecall } from '@viteval/core';
 *
 * const result = await contextEntityRecall({
 *   input: 'Who founded Microsoft?',
 *   output: 'Bill Gates and Paul Allen founded Microsoft in 1975.',
 *   expected: 'Bill Gates',
 * });
 * ```
 */
export const contextEntityRecall = createJudgeScorer({
  choiceScores: CHOICE_SCORES,
  name: 'ContextEntityRecall',
  prompt: PROMPT,
});
