import { createScorer } from '#/scorer/custom';
import { runJudge } from './judge';

const PROMPT = `You are comparing a submitted summary of a given text to an expert summary. Here is the data:
[BEGIN DATA]
************
[Text]: {{input}}
************
A: {{expected}}
************
B: {{output}}
************
[END DATA]

Compare summary A with summary B. Ignore any differences in style, grammar, or punctuation.
Determine which summary better describes the original text.`;

const CHOICE_SCORES: Record<string, number> = { A: 0, B: 1 };

export const summary = createScorer({
  name: 'Summary',
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
