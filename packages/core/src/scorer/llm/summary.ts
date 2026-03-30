import { createJudgeScorer } from './create-judge-scorer';

const PROMPT = `You are comparing a submitted summary to an expert summary of a given text.

<text>
{{input}}
</text>

<expert_summary>
{{expected}}
</expert_summary>

<submitted_summary>
{{output}}
</submitted_summary>

Compare the submitted summary with the expert summary. Ignore any differences in style, grammar, or punctuation.
Determine which summary better describes the original text.`;

const CHOICE_SCORES: Record<string, number> = { A: 0, B: 1 };

/**
 * Scores summary quality by comparing a submitted summary to an expert summary.
 *
 * Uses an LLM judge to determine which summary better describes the original text.
 *
 * @example
 * ```ts
 * import { summary } from '@viteval/core';
 *
 * const result = await summary({
 *   input: 'The full article text...',
 *   output: 'A brief summary of the article.',
 *   expected: 'An expert summary of the article.',
 * });
 * ```
 */
export const summary = createJudgeScorer({
  name: 'Summary',
  prompt: PROMPT,
  choiceScores: CHOICE_SCORES,
});
