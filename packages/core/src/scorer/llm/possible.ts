import { createScorer } from '#/scorer/custom';
import { runJudge } from './judge';

const PROMPT = `You are analyzing a statement for a task.
You want to figure out if the statement declares the task as impossible or provides a solution.
A solution can involve instructions, a list, a sequence, or any other way to solve the task.
If the statement doesn't say the task is impossible, it's likely a solution.

<task>
{{input}}
</task>

<submission>
{{output}}
</submission>

(A) The statement declares the task to be impossible
(B) The statement provides instructions on how to solve a given task, or provides a solution`;

const CHOICE_SCORES: Record<string, number> = { A: 0, B: 1 };

/**
 * Scores whether a submission provides a solution or declares a task impossible.
 *
 * Uses an LLM judge to classify the response as either a solution attempt or
 * a declaration of impossibility.
 *
 * @example
 * ```ts
 * import { possible } from '@viteval/core';
 *
 * const result = await possible({
 *   input: 'Write a haiku about rain.',
 *   output: 'Drops fall from the sky / Puddles form on the wet ground / Nature sings its song',
 * });
 * // result.score === 1 (solution provided)
 * ```
 */
export const possible = createScorer({
  name: 'Possible',
  score: async ({ output, expected, input, ...extra }) => {
    const result = await runJudge(
      { prompt: PROMPT, choiceScores: CHOICE_SCORES, useCoT: true },
      { output, expected, input, ...extra },
    );
    return {
      score: result.score,
      metadata: { choice: result.choice, rationale: result.rationale },
    };
  },
});
