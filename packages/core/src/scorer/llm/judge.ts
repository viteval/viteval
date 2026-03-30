import type { LanguageModel } from 'ai';
import { generateObject } from 'ai';
import Mustache from 'mustache';
import { z } from 'zod';
import { requireModel } from '#/provider/client';

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
  model?: LanguageModel;
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
 * @returns The judge result with score, choice, and optional rationale.
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
 * ```
 */
export async function runJudge(
  config: JudgeConfig,
  variables: Record<string, unknown>
): Promise<JudgeResult> {
  const model = config.model ?? requireModel();

  const renderedPrompt = Mustache.render(config.prompt, variables);
  const choices = Object.keys(config.choiceScores);
  const choicesStr = choices.map((c) => `"${c}"`).join(', ');

  const systemSuffix = config.useCoT
    ? `Answer with your reasoning in a step-by-step manner, then select one of the following choices: ${choicesStr}.`
    : `Select one of the following choices: ${choicesStr}.`;

  const schema = config.useCoT
    ? z.object({
        reasons: z.string().describe('Step-by-step reasoning for the choice.'),
        choice: z
          .enum(choices as [string, ...string[]])
          .describe('The selected choice.'),
      })
    : z.object({
        choice: z
          .enum(choices as [string, ...string[]])
          .describe('The selected choice.'),
      });

  const { object } = await generateObject({
    model,
    prompt: `${renderedPrompt}\n\n${systemSuffix}`,
    schema,
    temperature: 0,
  });

  const score = config.choiceScores[object.choice];
  if (score === undefined) {
    throw new Error(`Unknown choice "${object.choice}" returned by LLM judge.`);
  }

  return {
    score,
    choice: object.choice,
    rationale: 'reasons' in object ? (object.reasons as string) : undefined,
  };
}
