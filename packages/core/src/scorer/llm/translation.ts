import { createScorer } from '#/scorer/custom';
import { runJudge } from './judge';

const PROMPT = `You are comparing the submitted translation to an expert translation of a sentence from {{{language}}} to English. Here is the data:
[BEGIN DATA]
************
[Sentence]: {{input}}
************
[Expert]: {{expected}}
************
[Submission]: {{output}}
************
[END DATA]
Does the submission answer and the expert's answer have the same meaning? Ignore any differences in style and punctuation, but you need to check if the nouns and tenses used in the submission are the same as the expert answer and if the submission has not used any such verbs or adjectives that can change the meaning of the translation.`;

const CHOICE_SCORES: Record<string, number> = { Y: 1.0, N: 0.0 };

export const translation = createScorer({
  name: 'Translation',
  score: async ({ output, expected, input, ...extra }) => {
    const language = (extra as Record<string, unknown>).language ?? 'Unknown';
    const result = await runJudge(
      { prompt: PROMPT, choiceScores: CHOICE_SCORES, useCoT: true },
      { output, expected, input, language, ...extra },
    );
    return {
      score: result.score,
      metadata: { choice: result.choice, rationale: result.rationale },
    };
  },
});
