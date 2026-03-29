import { createScorer } from '#/scorer/custom';
import { runJudge } from './judge';

const PROMPT = `You are evaluating the correctness of an answer to a question. Here is the data:
[BEGIN DATA]
************
[Question]: {{input}}
************
[Expected Answer]: {{expected}}
************
[Submitted Answer]: {{output}}
************
[END DATA]

Evaluate whether the submitted answer is correct based on the expected answer. Consider factual accuracy and completeness.
(A) The submitted answer is completely correct and matches the expected answer.
(B) The submitted answer is partially correct but missing important details.
(C) The submitted answer is incorrect or contradicts the expected answer.`;

const CHOICE_SCORES: Record<string, number> = { A: 1.0, B: 0.5, C: 0 };

export const answerCorrectness = createScorer({
  name: 'AnswerCorrectness',
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
