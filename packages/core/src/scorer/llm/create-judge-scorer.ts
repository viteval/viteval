import { createScorer } from '#/scorer/custom';
import type { Scorer } from '#/types';
import { runJudge } from './judge';

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
 * Create a scorer that delegates to an LLM judge.
 *
 * @param config - The judge scorer configuration.
 * @returns A scorer that calls {@link runJudge} and returns the score with choice/rationale metadata.
 *
 * @example
 * ```ts
 * const myScorer = createJudgeScorer({
 *   name: 'MyScorer',
 *   prompt: 'Is {{output}} correct given {{input}}?',
 *   choiceScores: { Yes: 1, No: 0 },
 * });
 * ```
 */
export function createJudgeScorer(
  config: JudgeScorerConfig
): Scorer<unknown, Record<string, unknown>> {
  return createScorer({
    name: config.name,
    score: async ({ output, expected, input, ...extra }) => {
      const result = await runJudge(
        {
          choiceScores: config.choiceScores,
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
