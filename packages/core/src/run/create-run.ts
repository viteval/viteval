import { createId } from '@paralleldrive/cuid2';
import { humanId } from 'human-id';
import { match } from 'ts-pattern';
import type { EvalProvider } from '#/provider/types';
import type { EvalResult } from '#/types';
import type {
  CreateRunParams,
  Run,
  RunConfig,
  RunState,
  RunStatus,
  RunSummary,
} from './types';
import { toStoredSummary } from './types';

/**
 * Create a new evaluation run.
 *
 * Returns a `Run` handle that manages identity generation, state
 * transitions, result collection, and optional provider persistence
 * for a single evaluation run.
 *
 * @param params - Optional run configuration.
 * @returns A `Run` lifecycle handle.
 *
 * @example
 * ```ts
 * const run = createRun();
 * console.log(run.name); // "brave-orange-dolphin"
 *
 * await run.start({ aggregation: 'mean', threshold: 0.8, scorerNames: ['accuracy'] });
 * await run.addResults(evalResults);
 * const final = await run.complete();
 * ```
 *
 * @example With provider persistence
 * ```ts
 * const run = createRun({ evalProvider: provider.evals });
 * await run.start(config);
 * await run.addResults(results);
 * await run.complete(); // persists summary to DB
 * ```
 */
export function createRun(params?: CreateRunParams): Run {
  const id = createId();
  const name =
    params?.name ??
    humanId({
      capitalize: false,
      separator: '-',
    });
  const createdAt = new Date().toISOString();

  let status: RunStatus = 'pending';
  let config: RunConfig | undefined;
  let summary: RunSummary | undefined;
  let storedRunId: string | undefined;
  const results: EvalResult[] = [];
  const evalProvider: EvalProvider | undefined = params?.evalProvider;

  function state(): RunState {
    return {
      config,
      createdAt,
      id,
      name,
      results: [...results],
      status,
      summary,
    };
  }

  async function start(runConfig: RunConfig): Promise<void> {
    config = runConfig;
    status = 'running';

    if (evalProvider) {
      const result = await evalProvider.create({
        config: runConfig,
        datasetId: params?.datasetId,
        metadata: params?.metadata,
        name,
        tags: params?.tags,
      });

      if (result.ok) {
        storedRunId = result.result.id;
      } else {
        // eslint-disable-next-line no-console -- surface persistence failures
        console.warn('[viteval] Failed to persist run start:', result.result);
      }
    }
  }

  async function addResults(newResults: EvalResult[]): Promise<void> {
    results.push(...newResults);

    if (!evalProvider || !storedRunId) {
      return;
    }

    const mapped = newResults.map((result) => ({
      evalRunId: storedRunId!,
      expected: result.expected,
      input: result.input,
      meanScore: result.mean,
      medianScore: result.median,
      metadata: result.metadata,
      output: result.output,
      passed: match(result.aggregation)
        .with('mean', () => result.mean >= result.threshold)
        .with('median', () => result.median >= result.threshold)
        .with('sum', () => result.sum >= result.threshold)
        .exhaustive(),
      scores: result.scores.map((s) => ({
        metadata: s.metadata,
        name: s.name,
        score: s.score ?? 0,
      })),
      sumScore: result.sum,
    }));

    if (evalProvider.addResults) {
      const batchResult = await evalProvider.addResults(mapped);
      if (!batchResult.ok) {
        // eslint-disable-next-line no-console -- surface persistence failures
        console.warn(
          '[viteval] Failed to persist results:',
          batchResult.result
        );
      }
    } else {
      const addResultPromises = await Promise.all(
        mapped.map((m) => evalProvider.addResult(m))
      );
      const failed = addResultPromises.filter((r) => !r.ok);
      if (failed.length > 0) {
        // eslint-disable-next-line no-console -- surface persistence failures
        console.warn(`[viteval] Failed to persist ${failed.length} result(s)`);
      }
    }
  }

  async function complete(
    opts?: { status?: 'completed' | 'failed' }
  ): Promise<RunState> {
    const finalStatus = opts?.status ?? 'completed';
    status = finalStatus;
    summary = computeSummary(results, config);

    if (evalProvider && storedRunId) {
      const result = await evalProvider.complete({
        id: storedRunId,
        status: finalStatus,
        summary: toStoredSummary(summary),
      });

      if (!result.ok) {
        // eslint-disable-next-line no-console -- surface persistence failures
        console.warn(
          '[viteval] Failed to persist run completion:',
          result.result
        );
      }
    }

    return state();
  }

  return {
    addResults,
    complete,
    id,
    name,
    start,
    state,
  };
}

/*
|------------------
| Internals
|------------------
*/

function computeSummary(
  results: EvalResult[],
  config?: RunConfig
): RunSummary {
  if (results.length === 0) {
    return {
      failedCount: 0,
      meanScore: 0,
      medianScore: 0,
      passed: true,
      passedCount: 0,
      sumScore: 0,
      totalCount: 0,
    };
  }

  const threshold = config?.threshold ?? 1;
  const aggregation = config?.aggregation ?? 'mean';

  let passedCount = 0;
  const totals = { mean: 0, median: 0, sum: 0 };

  for (const result of results) {
    totals.mean += result.mean;
    totals.median += result.median;
    totals.sum += result.sum;

    const score = match(aggregation)
      .with('mean', () => result.mean)
      .with('median', () => result.median)
      .with('sum', () => result.sum)
      .exhaustive();

    if (score >= threshold) {
      passedCount++;
    }
  }

  const totalCount = results.length;

  return {
    failedCount: totalCount - passedCount,
    meanScore: totals.mean / totalCount,
    medianScore: totals.median / totalCount,
    passed: passedCount === totalCount,
    passedCount,
    sumScore: totals.sum,
    totalCount,
  };
}
