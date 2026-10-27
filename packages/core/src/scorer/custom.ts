import type * as TF from 'type-fest';
import type { Extra, Score, Scorer, ScorerArgs } from '#/types';
import { type RuntimeContext, getRuntimeContext } from '#/config/runtime';

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
  config:
    | ScorerConfig<OUTPUT, EXPECTED, EXTRA>
    | ((context: RuntimeContext) => ScorerConfig<OUTPUT, EXPECTED, EXTRA>)
): Scorer<OUTPUT, EXPECTED, EXTRA> {
  return Object.defineProperty(
    async (args: ScorerArgs<OUTPUT, EXPECTED, EXTRA>) => {
      const resolved =
          typeof config === 'function' ? config(getRuntimeContext()) : config,
        result = await resolved.score(args);
      return {
        metadata: result.metadata,
        name: resolved.name,
        score: result.score,
      };
    },
    'name',
    {
      get: () =>
        typeof config === 'function'
          ? config(getRuntimeContext()).name
          : config.name,
    }
  );
}

type ScoreResult = TF.Simplify<TF.SetOptional<Score, 'name'>>;
