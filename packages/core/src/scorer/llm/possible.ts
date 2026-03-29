import { createScorer } from '#/scorer/custom';
import { runJudge } from './judge';

const PROMPT = `You are analyzing a statement for a task.
You want to figure out if the statement declares the task as impossible or provides a solution.
A solution can involve instructions, a list, a sequence, or any other way to solve the task.
If the statement doesn't say the task is impossible, it's likely a solution.

[BEGIN DATA]
************
[Task]: {{input}}
************
[Submission]: {{output}}
************
[END DATA]

(A) The statement declares the task to be impossible
(B) The statement provides instructions on how to solve a given task, or provides a solution`;

const CHOICE_SCORES: Record<string, number> = { A: 0, B: 1 };

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
