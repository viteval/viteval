import Mustache from 'mustache';
import { requireClient } from '#/provider/client';

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
  /** Model to use for the evaluation */
  model?: string;
}

/**
 * Result from an LLM judge evaluation.
 */
export interface JudgeResult {
  score: number;
  choice: string;
  rationale?: string;
}

const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * Run an LLM-as-judge evaluation using OpenAI function calling.
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
  const client = requireClient();

  const renderedPrompt = Mustache.render(config.prompt, variables);
  const choices = Object.keys(config.choiceScores);
  const choicesStr = choices.map((c) => `"${c}"`).join(', ');

  const systemSuffix = config.useCoT
    ? `Answer by calling the \`select_choice\` function with your reasoning in a step-by-step manner, then select one of the following choices: ${choicesStr}.`
    : `Answer by calling the \`select_choice\` function and selecting one of the following choices: ${choicesStr}.`;

  const tool = {
    function: {
      name: 'select_choice',
      description: 'Select the best choice based on the evaluation.',
      parameters: {
        type: 'object',
        properties: {
          ...(config.useCoT
            ? {
                reasons: {
                  type: 'string',
                  description: 'Step-by-step reasoning for the choice.',
                },
              }
            : {}),
          choice: {
            type: 'string',
            enum: choices,
            description: 'The selected choice.',
          },
        },
        required: config.useCoT ? ['reasons', 'choice'] : ['choice'],
      },
    },
    type: 'function' as const,
  };

  const response = await client.chat.completions.create({
    messages: [
      { role: 'user', content: `${renderedPrompt}\n\n${systemSuffix}` },
    ],
    model: config.model ?? DEFAULT_MODEL,
    temperature: 0,
    tool_choice: { type: 'function', function: { name: 'select_choice' } },
    tools: [tool],
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.[0];
  if (
    !toolCall ||
    !('function' in toolCall) ||
    toolCall.function.name !== 'select_choice'
  ) {
    throw new Error('LLM judge did not return a valid tool call.');
  }

  let parsed: { choice: string; reasons?: string };
  try {
    parsed = JSON.parse(toolCall.function.arguments);
  } catch {
    throw new Error(
      'LLM judge returned malformed JSON in tool call arguments.'
    );
  }

  const score = config.choiceScores[parsed.choice];
  if (score === undefined) {
    throw new Error(`Unknown choice "${parsed.choice}" returned by LLM judge.`);
  }

  return {
    choice: parsed.choice,
    rationale: parsed.reasons,
    score,
  };
}
