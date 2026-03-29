import { createScorer } from '#/scorer/custom';
import { runJudge } from './judge';

const PROMPT = `Is the following funny?

<content>{{output}}</content>`;

const CHOICE_SCORES: Record<string, number> = { Yes: 1.0, No: 0.0, Unsure: 0.5 };

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
export const humor = createScorer({
  name: 'Humor',
  score: async ({ output, expected, input, ...extra }) => {
    const result = await runJudge(
      { prompt: PROMPT, choiceScores: CHOICE_SCORES, useCoT: false },
      { output, expected, input, ...extra },
    );
    return {
      score: result.score,
      metadata: { choice: result.choice, rationale: result.rationale },
    };
  },
});
