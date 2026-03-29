import { createScorer } from '#/scorer/custom';
import { runJudge } from './judge';

const PROMPT = `You are comparing a submitted answer to an expert answer on a given SQL coding question. Here is the data:
[BEGIN DATA]
************
[Question]: {{input}}
************
[Expert]: {{expected}}
************
[Submission]: {{output}}
************
[END DATA]

Compare the content and correctness of the submitted SQL with the expert answer. Ignore any differences in whitespace, style, or output column names.
The submitted answer may either be correct or incorrect. Determine which case applies. Answer the question by responding with one of the following:
"Correct": The submitted SQL and the expert answer are semantically the same, i.e. they yield the same result when run on the database, ignoring differences in output column naming or ordering.
"Incorrect": The submitted SQL and the expert answer are semantically different, i.e. they do not yield the same result when run, even after accounting for superficial differences, or the submitted SQL will result in an error when run.`;

const CHOICE_SCORES: Record<string, number> = { Correct: 1.0, Incorrect: 0 };

export const sql = createScorer({
  name: 'SQL',
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
