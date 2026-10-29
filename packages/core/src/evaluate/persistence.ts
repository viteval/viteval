import { attemptAsync, isErr } from 'massaman/control';
import { match } from 'massaman/match';
import { meanBy, medianBy, sumBy } from 'massaman/math';
import { writeDestinations } from '#/provider/destinations';
import type {
  AddEvalResultParams,
  CreateEvalRunParams,
  EvalProvider,
} from '#/provider/types';
import type { NormalizedEvalResult } from './case';

interface OpenEvaluationPersistenceParams {
  providers: readonly EvalProvider[];
  run: CreateEvalRunParams;
}

interface CompleteEvaluationParams {
  results: readonly AddEvalResultParams[];
  errors: readonly string[];
}

interface ProjectEvaluationResultParams {
  result: NormalizedEvalResult;
  state: 'passed' | 'failed' | 'skipped';
  errors: readonly string[];
  duration?: number;
}

/**
 * Project a final case outcome into artifact and persistence records.
 * @param params - Scored case and engine-neutral final outcome.
 * @returns Matching artifact and stored-result projections.
 * @example projectEvaluationResult({ result, state: 'passed', errors: [] });
 * @internal
 */
export function projectEvaluationResult({
  result,
  state,
  errors,
  duration,
}: ProjectEvaluationResultParams) {
  const diagnostic = errors.join('\n');
  const metadata = {
    ...result.metadata,
    name: result.name,
    state,
    ...match(Boolean(diagnostic))
      .with(true, () => ({ executionError: diagnostic }))
      .with(false, () => ({}))
      .exhaustive(),
  };
  const stored: AddEvalResultParams = {
    evalRunId: '',
    input: result.input ?? null,
    expected: result.expected ?? null,
    output: result.output ?? null,
    scores: result.scores,
    meanScore: result.mean,
    medianScore: result.median,
    sumScore: result.sum,
    passed: state === 'passed',
    metadata,
    duration,
  };
  return { artifact: { ...result, metadata }, stored };
}

/**
 * Open destination runs while retaining partial successes for finalization.
 * @param params - Explicit writers and engine-neutral run metadata.
 * @returns Initialization diagnostics, verification, and completion operations.
 * @example const session = await openEvaluationPersistence({ providers, run });
 * @internal
 */
export async function openEvaluationPersistence({
  providers,
  run,
}: OpenEvaluationPersistenceParams) {
  const outcomes = await Promise.all(
    providers.map(async (provider) => ({
      provider,
      result: await attemptAsync(async () => {
        const result = await provider.create(run);
        if (isErr(result)) {
          throw result.error;
        }
        return result.value;
      }),
    }))
  );
  const runs = outcomes.flatMap(({ provider, result }) => {
    if (isErr(result)) {
      return [];
    }
    return [{ provider, id: result.value.id }];
  });
  const errors = outcomes.flatMap(({ result }) => {
    if (isErr(result)) {
      return [result.error.message];
    }
    return [];
  });
  return {
    errors,
    async verify() {
      await writeDestinations(
        outcomes.map(
          ({ result }) =>
            async () =>
              result
        )
      );
    },
    async complete({
      results,
      errors: executionErrors,
    }: CompleteEvaluationParams) {
      const failedCount = results.filter(
        (result) => result.metadata?.state === 'failed'
      ).length;
      const scored = results.filter(
        (result) => result.metadata?.state !== 'skipped'
      );
      const passed =
        executionErrors.length === 0 &&
        errors.length === 0 &&
        failedCount === 0;
      await writeDestinations(
        runs.map(({ provider, id }) => async () => {
          for (const result of results) {
            const saved = await provider.addResult({
              ...result,
              evalRunId: id,
            });
            if (isErr(saved)) {
              return saved;
            }
          }
          return provider.complete({
            id,
            status: match(passed)
              .with(true, () => 'completed' as const)
              .with(false, () => 'failed' as const)
              .exhaustive(),
            summary: {
              meanScore: scored.length
                ? meanBy(scored, (result) => result.meanScore)
                : 0,
              medianScore: scored.length
                ? medianBy(scored, (result) => result.medianScore)
                : 0,
              sumScore: sumBy(scored, (result) => result.sumScore),
              passedCount: results.filter((result) => result.passed).length,
              failedCount,
              totalCount: results.length,
              passed,
            },
          });
        })
      );
    },
  };
}
