import { generateObject } from 'ai';
import { type Result, attemptAsync, err, isErr, ok } from 'massaman/control';
import Mustache from 'mustache';
import { z } from 'zod';
import {
  type LanguageModelSelection,
  resolveLanguageModel,
} from '#/model/client';

/**
 * Configuration for an LLM-as-judge evaluation.
 */
export interface JudgeConfig {
  /** Mustache prompt template with variables like {{input}}, {{output}}, {{expected}} */
  prompt: string;
  /** Map of choice labels to numeric scores */
  choiceScores: Record<string, number>;
  /** Whether to use chain-of-thought reasoning */
  useCoT?: boolean;
  /** Model override for this judge evaluation */
  model?: LanguageModelSelection;
}

/**
 * Result from an LLM judge evaluation.
 */
export interface JudgeResult {
  score: number;
  choice: string;
  rationale?: string;
}

/**
 * Run an LLM-as-judge evaluation using structured output.
 *
 * @param config - The judge configuration (prompt template, choice scores, etc.)
 * @param variables - Template variables to render into the prompt.
 * @returns The judge result or the error that prevented evaluation.
 *
 * @example
 * ```ts
 * const result = await runJudge(
 *   {
 *     prompt: 'Is {{output}} correct given {{input}}?',
 *     choiceScores: { Yes: 1, No: 0 },
 *   },
 *   { input: '2+2', output: '4' }
 * );
 * if (result.ok) {
 *   const score = result.value.score;
 * }
 * ```
 */
export async function runJudge(
  config: JudgeConfig,
  variables: Record<string, unknown>
): Promise<Result<JudgeResult>> {
  const modelResult = resolveLanguageModel(config.model);
  if (isErr(modelResult)) {
    return modelResult;
  }

  const choices = Object.keys(config.choiceScores),
    choicesStr = choices.map((c) => `"${c}"`).join(', '),
    systemSuffix = config.useCoT
      ? `Answer with your reasoning in a step-by-step manner, then select one of the following choices: ${choicesStr}.`
      : `Select one of the following choices: ${choicesStr}.`,
    schema = config.useCoT
      ? z.object({
          choice: z
            .enum(choices as [string, ...string[]])
            .describe('The selected choice.'),
          reasons: z
            .string()
            .describe('Step-by-step reasoning for the choice.'),
        })
      : z.object({
          choice: z
            .enum(choices as [string, ...string[]])
            .describe('The selected choice.'),
        }),
    generationResult = await attemptAsync(() => {
      const renderedPrompt = Mustache.render(config.prompt, variables);
      return generateObject({
        model: modelResult.value,
        prompt: `${renderedPrompt}\n\n${systemSuffix}`,
        schema,
        temperature: 0,
      });
    });
  if (isErr(generationResult)) {
    return generationResult;
  }

  const { object } = generationResult.value,
    score = config.choiceScores[object.choice];
  if (score === undefined) {
    return err(`Unknown choice "${object.choice}" returned by LLM judge.`);
  }

  return ok({
    choice: object.choice,
    rationale: 'reasons' in object ? (object.reasons as string) : undefined,
    score,
  });
}
