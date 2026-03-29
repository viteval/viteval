import { createScorer } from '#/scorer/custom';
import { runJudge } from './judge';

const PROMPT = `You are evaluating entity recall from a given context against an expected answer. Here is the data:
[BEGIN DATA]
************
[Question]: {{input}}
************
[Context]: {{output}}
************
[Expected Answer]: {{expected}}
************
[END DATA]

Evaluate what fraction of the important entities in the expected answer are present in the context. Consider named entities, key concepts, and important terms.
(A) All important entities from the expected answer are found in the context.
(B) Most important entities from the expected answer are found in the context.
(C) Some important entities from the expected answer are found in the context.
(D) Few or no important entities from the expected answer are found in the context.`;

const CHOICE_SCORES: Record<string, number> = { A: 1.0, B: 0.7, C: 0.3, D: 0 };

export const contextEntityRecall = createScorer({
  name: 'ContextEntityRecall',
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
