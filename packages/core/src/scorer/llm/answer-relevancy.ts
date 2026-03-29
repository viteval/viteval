import { createScorer } from '#/scorer/custom';
import { runJudge } from './judge';

const PROMPT = `You are evaluating the relevancy of an answer to a given question.

<question>
{{input}}
</question>

<answer>
{{output}}
</answer>

Evaluate whether the answer is relevant to the question asked. Consider whether it directly addresses the question.
(A) The answer is highly relevant and directly addresses the question.
(B) The answer is somewhat relevant but includes unnecessary information or partially addresses the question.
(C) The answer is not relevant to the question.`;

const CHOICE_SCORES: Record<string, number> = { A: 1.0, B: 0.5, C: 0 };

/**
 * Scores how relevant an answer is to the given question.
 *
 * Uses an LLM judge to evaluate whether the answer directly addresses the question.
 *
 * @example
 * ```ts
 * import { answerRelevancy } from '@viteval/core';
 *
 * const result = await answerRelevancy({
 *   input: 'What is the capital of France?',
 *   output: 'Paris is the capital of France.',
 * });
 * ```
 */
export const answerRelevancy = createScorer({
  name: 'AnswerRelevancy',
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
