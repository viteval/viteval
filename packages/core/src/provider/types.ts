import type { Result } from '@viteval/internal';

/*
|------------------
| Stored Domain Types
|------------------
*/

/**
 * A dataset record as persisted by a provider.
 */
export interface StoredDataset {
  id: string;
  name: string;
  description?: string;
  version: number;
  itemCount: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A single item within a stored dataset.
 */
export interface StoredDataItem {
  id: string;
  datasetId: string;
  input: unknown;
  expected: unknown;
  extra: Record<string, unknown>;
  ordinal: number;
}

/**
 * A recorded evaluation run.
 */
export interface StoredEvalRun {
  id: string;
  name: string;
  datasetId?: string;
  status: 'running' | 'completed' | 'failed';
  config: StoredEvalConfig;
  summary?: StoredEvalSummary;
  results?: StoredEvalResult[];
  tags: string[];
  metadata: Record<string, unknown>;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Configuration snapshot for a stored eval run.
 */
export interface StoredEvalConfig {
  aggregation: 'mean' | 'median' | 'sum';
  threshold: number;
  scorerNames: string[];
  timeout?: number;
}

/**
 * Aggregated summary for a completed eval run.
 */
export interface StoredEvalSummary {
  meanScore: number;
  medianScore: number;
  sumScore: number;
  passedCount: number;
  failedCount: number;
  totalCount: number;
  passed: boolean;
}

/**
 * A single result within an eval run.
 */
export interface StoredEvalResult {
  id: string;
  evalRunId: string;
  input: unknown;
  expected: unknown;
  output: unknown;
  scores: {
    name: string;
    score: number;
    metadata?: Record<string, unknown>;
  }[];
  meanScore: number;
  medianScore: number;
  sumScore: number;
  passed: boolean;
  duration?: number;
  metadata: Record<string, unknown>;
}

/*
|------------------
| Dataset Provider Params
|------------------
*/

export interface CreateDatasetParams {
  name: string;
  description?: string;
  items?: {
    input: unknown;
    expected: unknown;
    extra?: Record<string, unknown>;
  }[];
  metadata?: Record<string, unknown>;
}

export type GetDatasetParams =
  | { id: string; name?: string }
  | { id?: string; name: string };

export interface ListDatasetsParams {
  limit?: number;
  offset?: number;
}

export interface UpdateDatasetParams {
  id: string;
  name?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface DeleteDatasetParams {
  id: string;
}

export interface GetDatasetItemsParams {
  datasetId: string;
  limit?: number;
  offset?: number;
}

export interface AddDatasetItemsParams {
  datasetId: string;
  items: {
    input: unknown;
    expected: unknown;
    extra?: Record<string, unknown>;
  }[];
}

/*
|------------------
| Eval Provider Params
|------------------
*/

export interface CreateEvalRunParams {
  name: string;
  datasetId?: string;
  config: StoredEvalConfig;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface GetEvalRunParams {
  id: string;
  includeResults?: boolean;
}

export interface ListEvalRunsParams {
  datasetId?: string;
  status?: 'running' | 'completed' | 'failed';
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface AddEvalResultParams {
  evalRunId: string;
  input: unknown;
  expected: unknown;
  output: unknown;
  scores: {
    name: string;
    score: number;
    metadata?: Record<string, unknown>;
  }[];
  meanScore: number;
  medianScore: number;
  sumScore: number;
  passed: boolean;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface CompleteEvalRunParams {
  id: string;
  status?: 'completed' | 'failed';
  summary: StoredEvalSummary;
}

/*
|------------------
| Provider Sub-Interfaces
|------------------
*/

/**
 * Dataset operations a provider can implement.
 */
export interface DatasetProvider {
  create(params: CreateDatasetParams): Promise<Result<StoredDataset>>;
  get(params: GetDatasetParams): Promise<Result<StoredDataset | null>>;
  list(params?: ListDatasetsParams): Promise<Result<StoredDataset[]>>;
  update(params: UpdateDatasetParams): Promise<Result<StoredDataset>>;
  delete(params: DeleteDatasetParams): Promise<Result<void>>;
  getItems(params: GetDatasetItemsParams): Promise<Result<StoredDataItem[]>>;
  addItems(params: AddDatasetItemsParams): Promise<Result<void>>;
}

/**
 * Eval run operations a provider can implement.
 */
export interface EvalProvider {
  create(params: CreateEvalRunParams): Promise<Result<StoredEvalRun>>;
  get(params: GetEvalRunParams): Promise<Result<StoredEvalRun | null>>;
  list(params?: ListEvalRunsParams): Promise<Result<StoredEvalRun[]>>;
  addResult(params: AddEvalResultParams): Promise<Result<StoredEvalResult>>;
  /**
   * Add multiple results to an eval run in a single batch.
   *
   * Optional — falls back to sequential `addResult()` calls if not implemented.
   * Providers that support batch insert (Braintrust, VoltAgent) should implement
   * this for better performance with large datasets.
   */
  addResults?(
    params: AddEvalResultParams[]
  ): Promise<Result<StoredEvalResult[]>>;
  complete(params: CompleteEvalRunParams): Promise<Result<StoredEvalRun>>;
}

/*
|------------------
| Provider Interface
|------------------
*/

/**
 * A provider is a pluggable backend for persisting and managing
 * datasets and evaluation runs.
 *
 * Providers range from simple storage backends (SQLite, Postgres)
 * to full platforms (Braintrust, Langfuse) that manage evals
 * on their own infrastructure.
 *
 * @example
 * ```ts
 * import { viteval } from '@viteval/providers';
 *
 * defineConfig({
 *   provider: viteval(),
 * });
 * ```
 */
export interface Provider {
  /** Unique name identifying this provider (e.g. 'viteval', 'braintrust'). */
  readonly name: string;
  /** Dataset operations. Undefined if this provider does not support datasets. */
  readonly datasets?: DatasetProvider;
  /** Eval run operations. Undefined if this provider does not support evals. */
  readonly evals?: EvalProvider;
  /**
   * Initialize the provider (run migrations, open connections, etc.).
   *
   * @returns A result indicating success or failure.
   */
  initialize(): Promise<Result<void>>;
  /**
   * Gracefully close the provider (drain connections, flush buffers, etc.).
   *
   * @returns A result indicating success or failure.
   */
  close(): Promise<Result<void>>;
}

/**
 * Provider configuration for `defineConfig()`.
 *
 * Accepts either a single provider for all domains, or per-domain providers
 * for composable setups.
 *
 * @example Single provider
 * ```ts
 * defineConfig({
 *   provider: viteval(),
 * });
 * ```
 *
 * @example Composable providers
 * ```ts
 * defineConfig({
 *   provider: {
 *     datasets: viteval(),
 *     evals: braintrust({ apiKey: '...' }),
 *   },
 * });
 * ```
 */
export type ProviderConfig =
  | Provider
  | {
      datasets?: DatasetProvider | Provider;
      evals?: EvalProvider | Provider;
    };

/*
|------------------
| Provider Factory Helper
|------------------
*/

/**
 * Parameters for creating a custom provider.
 */
export interface CreateProviderParams {
  name: string;
  datasets?: DatasetProvider;
  evals?: EvalProvider;
  initialize?: () => Promise<Result<void>>;
  close?: () => Promise<Result<void>>;
}
