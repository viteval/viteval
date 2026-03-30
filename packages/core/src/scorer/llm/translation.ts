import type { LanguageModel } from 'ai';
import type { Scorer } from '#/types';
import { createScorer } from '#/scorer/custom';
import { runJudge } from './judge';

/**
 * Options for the Translation scorer.
 */
export interface TranslationOptions {
  /** Model override for this scorer */
  model?: LanguageModel;
}

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

const CHOICE_SCORES: Record<string, number> = { N: 0, Y: 1 };

/**
 * Create a translation accuracy scorer.
 *
 * @param options - Optional configuration.
 * @returns A scorer that uses an LLM judge to evaluate translation quality.
 *
 * @example
 * ```ts
 * import { scorers } from 'viteval';
 *
 * scorers: [scorers.translation()]
 * ```
 */
export function translation(
  options?: TranslationOptions
): Scorer {
  return createScorer({
    name: 'Translation',
    score: async ({ output, expected, input, ...extra }) => {
      const language =
        ('language' in extra ? extra.language : undefined) ?? 'Unknown';
      const result = await runJudge(
        {
          choiceScores: CHOICE_SCORES,
          model: options?.model,
          prompt: PROMPT,
          useCoT: true,
        },
        { expected, input, language, output, ...extra }
      );
      return {
        metadata: { choice: result.choice, rationale: result.rationale },
        score: result.score,
      };
    },
  });
}
