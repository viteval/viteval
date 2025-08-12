import type { Extra, Score, Scorer, ScorerArgs } from '#/types';

/**
 * A scorer config for creating a custom scorer.
 */
export interface ScorerConfig<OUTPUT, EXTRA extends Extra> {
  name: string;
  score: (
    args: ScorerArgs<OUTPUT, EXTRA>
  ) => Omit<Score, 'name'> | Promise<Omit<Score, 'name'>>;
}

/**
 * Create a custom scorer.
 *
 * @param config - The scorer config.
 * @returns The scorer.
 */
export function createScorer<OUTPUT, EXTRA extends Extra>(
  config: ScorerConfig<OUTPUT, EXTRA>
): Scorer<OUTPUT, EXTRA> {
  return async (args) => {
    const result = await config.score(args);
    return {
      name: config.name,
      score: result.score,
      metadata: result.metadata,
    };
  };
}
