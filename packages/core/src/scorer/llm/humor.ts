import { createJudgeScorer } from './create-judge-scorer';

const PROMPT = `Is the following funny?

<content>
{{output}}
</content>`;

const CHOICE_SCORES: Record<string, number> = {
  No: 0,
  Unsure: 0.5,
  Yes: 1,
};

/**
 * Scores whether the output is funny.
 *
 * Uses an LLM judge to classify the output as funny, not funny, or unsure.
 *
 * @example
 * ```ts
 * import { humor } from '@viteval/core';
 *
 * const result = await humor({ output: 'Why did the chicken cross the road?' });
 * ```
 */
export const humor = createJudgeScorer({
  choiceScores: CHOICE_SCORES,
  name: 'Humor',
  prompt: PROMPT,
  useCoT: false,
});
