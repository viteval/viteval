import type { LanguageModel } from 'ai';
import type { Scorer } from '#/types';
import { createScorer } from '#/scorer/custom';
import { runJudge } from './judge';

/**
 * Options for a judge-based scorer.
 */
export interface JudgeScorerOptions {
  /** Model override for this scorer */
  model?: LanguageModel;
}

/**
 * Configuration for creating a judge-based scorer via {@link createJudgeScorer}.
 */
export interface JudgeScorerConfig {
  /** Display name of the scorer */
  name: string;
  /** Mustache prompt template */
  prompt: string;
  /** Map of choice labels to numeric scores */
  choiceScores: Record<string, number>;
  /** Whether to use chain-of-thought reasoning (default: true) */
  useCoT?: boolean;
}

/**
 * Create a scorer factory that delegates to an LLM judge.
 *
 * @param config - The judge scorer configuration.
 * @returns A factory function that accepts optional {@link JudgeScorerOptions} and returns a scorer.
 *
 * @example
 * ```ts
 * const myScorer = createJudgeScorer({
 *   name: 'MyScorer',
 *   prompt: 'Is {{output}} correct given {{input}}?',
 *   choiceScores: { Yes: 1, No: 0 },
 * });
 *
 * // Use with defaults
 * evaluate('test', { scorers: [myScorer()] });
 *
 * // Use with model override
 * evaluate('test', { scorers: [myScorer({ model: openai('gpt-4o') })] });
 * ```
 */
export function createJudgeScorer(
  config: JudgeScorerConfig
): (options?: JudgeScorerOptions) => Scorer {
  return (options) =>
    createScorer({
      name: config.name,
      score: async ({ output, expected, input, ...extra }) => {
        const result = await runJudge(
          {
            choiceScores: config.choiceScores,
            model: options?.model,
            prompt: config.prompt,
            useCoT: config.useCoT ?? true,
          },
          { expected, input, output, ...extra }
        );
        return {
          metadata: { choice: result.choice, rationale: result.rationale },
          score: result.score,
        };
      },
    });
}
