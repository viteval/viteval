import type * as TF from 'type-fest';
import { once } from 'massaman/function';
import type { Extra, Score, Scorer, ScorerArgs } from '#/types';
import {
  type RuntimeContext,
  getProjectRuntime,
  getRuntimeContext,
} from '#/config/runtime';

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
  const resolve = createConfigResolver(config);
  return Object.defineProperty(
    async (args: ScorerArgs<OUTPUT, EXPECTED, EXTRA>) => {
      const resolved = resolve(),
        result = await resolved.score(args);
      return {
        metadata: result.metadata,
        name: resolved.name,
        score: result.score,
      };
    },
    'name',
    {
      get: () => resolve().name,
    }
  );
}

type ScoreResult = TF.Simplify<TF.SetOptional<Score, 'name'>>;

/*
|------------------
| Internals
|------------------
*/

function createConfigResolver<OUTPUT, EXPECTED, EXTRA extends Extra>(
  config:
    | ScorerConfig<OUTPUT, EXPECTED, EXTRA>
    | ((context: RuntimeContext) => ScorerConfig<OUTPUT, EXPECTED, EXTRA>)
): () => ScorerConfig<OUTPUT, EXPECTED, EXTRA> {
  if (typeof config !== 'function') {
    return () => config;
  }
  const configurations = new WeakMap<
    RuntimeContext,
    ScorerConfig<OUTPUT, EXPECTED, EXTRA>
  >();
  const fallback = once(getRuntimeContext);
  return () => {
    const context = getProjectRuntime()?.context ?? fallback();
    const existing = configurations.get(context);
    if (existing) {
      return existing;
    }
    const resolved = config(context);
    configurations.set(context, resolved);
    return resolved;
  };
}
