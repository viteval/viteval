import type { EvalProvider, StoredEvalSummary } from '#/provider/types';
import type { EvalResult } from '#/types';

/**
 * Snapshot of the eval configuration attached to a run.
 */
export interface RunConfig {
  readonly aggregation: 'mean' | 'median' | 'sum';
  readonly threshold: number;
  readonly scorerNames: string[];
  readonly timeout?: number;
}

/**
 * Current status of a run.
 */
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Aggregated summary computed when a run completes.
 */
export interface RunSummary {
  readonly meanScore: number;
  readonly medianScore: number;
  readonly sumScore: number;
  readonly passedCount: number;
  readonly failedCount: number;
  readonly totalCount: number;
  readonly passed: boolean;
}

/**
 * A read-only snapshot of the run's current state.
 */
export interface RunState {
  readonly id: string;
  readonly name: string;
  readonly status: RunStatus;
  readonly config?: RunConfig;
  readonly summary?: RunSummary;
  readonly results: readonly EvalResult[];
  readonly createdAt: string;
}

/**
 * Parameters for `createRun()`.
 */
export interface CreateRunParams {
  /** Override the generated human-readable name. */
  name?: string;
  /** Eval provider for DB persistence. When omitted, the run is local-only. */
  evalProvider?: EvalProvider;
  /** Dataset ID to associate with this run. */
  datasetId?: string;
  /** Tags for filtering runs. */
  tags?: string[];
  /** Arbitrary metadata attached to the run. */
  metadata?: Record<string, unknown>;
}

/**
 * A run lifecycle handle returned by `createRun()`.
 *
 * Manages identity, state transitions, result collection,
 * and optional provider persistence for a single evaluation run.
 */
export interface Run {
  /** Unique cuid2 identifier for this run. */
  readonly id: string;
  /** Human-readable kebab-case name (e.g. `brave-orange-dolphin`). */
  readonly name: string;

  /**
   * Read-only snapshot of the current run state.
   *
   * @returns The current state of the run.
   */
  state(): RunState;

  /**
   * Transition from `pending` to `running`.
   * Persists the run to the eval provider if configured.
   *
   * @param config - Eval configuration snapshot for this run.
   */
  start(config: RunConfig): Promise<void>;

  /**
   * Record evaluation results into the run.
   * Persists to the eval provider if configured.
   *
   * @param results - The eval results to add.
   */
  addResults(results: EvalResult[]): Promise<void>;

  /**
   * Transition to `completed` or `failed`.
   * Computes the summary and persists to the eval provider if configured.
   *
   * @param params - Optional status override (defaults to `completed`).
   * @returns The final run state.
   */
  complete(params?: { status?: 'completed' | 'failed' }): Promise<RunState>;
}

/*
|------------------
| Internals
|------------------
*/

/**
 * Map a `RunSummary` to the provider's `StoredEvalSummary` shape.
 *
 * @param summary - The run summary to map.
 * @returns The stored eval summary.
 */
export function toStoredSummary(summary: RunSummary): StoredEvalSummary {
  return {
    failedCount: summary.failedCount,
    meanScore: summary.meanScore,
    medianScore: summary.medianScore,
    passed: summary.passed,
    passedCount: summary.passedCount,
    sumScore: summary.sumScore,
    totalCount: summary.totalCount,
  };
}
