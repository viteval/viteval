import type * as TF from 'type-fest';
import type { Extra, Score, Scorer, ScorerArgs } from '#/types';

/**
 * A scorer config for creating a custom scorer.
 */
export interface ScorerConfig<
  OUTPUT,
  EXPECTED = OUTPUT,
  EXTRA extends Extra = Extra,
> {
  /**
   * The name of the scorer.
   */
  name: string;
  /**
   * The score function.
   */
  score: (
    args: ScorerArgs<OUTPUT, EXPECTED, EXTRA>
  ) => ScoreResult | Promise<ScoreResult>;
}

/**
 * Create a custom scorer.
 *
 * @param config - The scorer config.
 * @returns The scorer.
 */
export function createScorer<
  OUTPUT,
  EXPECTED = OUTPUT,
  EXTRA extends Extra = Extra,
>(
  config: ScorerConfig<OUTPUT, EXPECTED, EXTRA>
): Scorer<OUTPUT, EXPECTED, EXTRA> {
  return Object.defineProperty(
    async (args: ScorerArgs<OUTPUT, EXPECTED, EXTRA>) => {
      const result = await config.score(args);
      return {
        metadata: result.metadata,
        name: config.name,
        score: result.score,
      };
    },
    'name',
    {
      value: config.name,
      writable: false,
    }
  );
}

type ScoreResult = TF.Simplify<TF.SetOptional<Score, 'name'>>;
