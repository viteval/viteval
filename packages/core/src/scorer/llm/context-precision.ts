import { createScorer } from '#/scorer/custom';
import { runJudge } from './judge';

const PROMPT = `You are evaluating the precision of a retrieved context for answering a question. Here is the data:
[BEGIN DATA]
************
[Question]: {{input}}
************
[Context]: {{output}}
************
[Expected Answer]: {{expected}}
************
[END DATA]

Evaluate whether the context is precise and focused on information needed to answer the question correctly.
(A) The context is highly precise and contains mostly relevant information for answering the question.
(B) The context contains some relevant information but also includes unnecessary details.
(C) The context is mostly irrelevant to answering the question.`;

const CHOICE_SCORES: Record<string, number> = { A: 1.0, B: 0.5, C: 0 };

export const contextPrecision = createScorer({
  name: 'ContextPrecision',
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
