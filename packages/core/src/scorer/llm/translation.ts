import { createScorer } from '#/scorer/custom';
import { runJudge } from './judge';

const PROMPT = `You are comparing a submitted translation to an expert translation of a sentence from {{{language}}} to English.

<source_sentence>
{{input}}
</source_sentence>

<expert_translation>
{{expected}}
</expert_translation>

<submitted_translation>
{{output}}
</submitted_translation>

Does the submitted translation and the expert translation have the same meaning? Ignore any differences in style and punctuation, but check if the nouns and tenses used in the submission are the same as the expert answer and if the submission has not used any verbs or adjectives that change the meaning of the translation.`;

const CHOICE_SCORES: Record<string, number> = { N: 0.0, Y: 1.0 };

/**
 * Scores translation accuracy by comparing a submission to an expert translation.
 *
 * Uses an LLM judge to evaluate whether both translations preserve the same
 * meaning, checking nouns, tenses, and semantic equivalence.
 *
 * @example
 * ```ts
 * import { translation } from '@viteval/core';
 *
 * const result = await translation({
 *   input: 'Bonjour le monde',
 *   output: 'Hello world',
 *   expected: 'Hello world',
 *   language: 'French',
 * });
 * ```
 */
export const translation = createScorer({
  name: 'Translation',
  score: async ({ output, expected, input, ...extra }) => {
    const language =
      ('language' in extra ? extra.language : undefined) ?? 'Unknown';
    const result = await runJudge(
      { choiceScores: CHOICE_SCORES, prompt: PROMPT, useCoT: true },
      { expected, input, language, output, ...extra }
    );
    return {
      metadata: { choice: result.choice, rationale: result.rationale },
      score: result.score,
    };
  },
});
