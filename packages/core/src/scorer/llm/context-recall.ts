import { createScorer } from '#/scorer/custom';
import { runJudge } from './judge';

const PROMPT = `You are evaluating the recall of a retrieved context against an expected answer. Here is the data:
[BEGIN DATA]
************
[Question]: {{input}}
************
[Context]: {{output}}
************
[Expected Answer]: {{expected}}
************
[END DATA]

Evaluate whether the context contains enough information to support the expected answer. Consider if all claims in the expected answer can be attributed to the context.
(A) The context fully supports the expected answer - all claims can be attributed to the context.
(B) The context partially supports the expected answer - some claims can be attributed to the context.
(C) The context does not support the expected answer - few or no claims can be attributed to the context.`;

const CHOICE_SCORES: Record<string, number> = { A: 1.0, B: 0.5, C: 0 };

export const contextRecall = createScorer({
  name: 'ContextRecall',
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
