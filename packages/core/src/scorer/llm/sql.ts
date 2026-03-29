import { createScorer } from '#/scorer/custom';
import { runJudge } from './judge';

const PROMPT = `You are comparing a submitted answer to an expert answer on a given SQL coding question.

<question>
{{input}}
</question>

<expert_sql>
{{expected}}
</expert_sql>

<submitted_sql>
{{output}}
</submitted_sql>

Compare the content and correctness of the submitted SQL with the expert answer. Ignore any differences in whitespace, style, or output column names.
The submitted answer may either be correct or incorrect. Determine which case applies:
"Correct": The submitted SQL and the expert answer are semantically the same, i.e. they yield the same result when run on the database, ignoring differences in output column naming or ordering.
"Incorrect": The submitted SQL and the expert answer are semantically different, i.e. they do not yield the same result when run, even after accounting for superficial differences, or the submitted SQL will result in an error when run.`;

const CHOICE_SCORES: Record<string, number> = { Correct: 1.0, Incorrect: 0 };

/**
 * Scores SQL query correctness by comparing a submission to an expert answer.
 *
 * Uses an LLM judge to evaluate semantic equivalence of SQL queries, ignoring
 * whitespace, style, and output column naming differences.
 *
 * @example
 * ```ts
 * import { sql } from '@viteval/core';
 *
 * const result = await sql({
 *   input: 'Select all users older than 25',
 *   output: 'SELECT * FROM users WHERE age > 25',
 *   expected: 'SELECT * FROM users WHERE age > 25',
 * });
 * ```
 */
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
