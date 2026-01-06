import type { DataItem } from '@viteval/core';
import type { DatasetProviderConfig } from '@viteval/core/dataset';

/**
 * Extra type for additional fields on data items.
 */
type Extra = Record<string, unknown>;

/**
 * VoltAgent-specific extra fields mapped from ExperimentDatasetItem.
 */
export interface VoltagentExtra extends Extra {
  /**
   * The unique identifier of the dataset item from VoltOps.
   */
  id: string;

  /**
   * Additional metadata associated with the item.
   */
  metadata?: Record<string, unknown> | null;

  /**
   * The ID of the dataset this item belongs to.
   */
  datasetId?: string;

  /**
   * The version ID of the dataset.
   */
  datasetVersionId?: string;

  /**
   * The name of the dataset.
   */
  datasetName?: string;

  /**
   * The raw item data from VoltOps.
   */
  raw?: unknown;
}

/**
 * Configuration for VoltAgent/VoltOps authentication.
 */
export interface VoltagentAuthConfig {
  /**
   * VoltOps API key. If not provided, reads from VOLTOPS_API_KEY env var.
   */
  apiKey?: string;

  /**
   * VoltOps API base URL. If not provided, reads from VOLTOPS_BASE_URL env var
   * or defaults to the production URL.
   */
  baseUrl?: string;
}

/**
 * Configuration for the VoltAgent dataset provider.
 */
export interface VoltagentProviderConfig extends DatasetProviderConfig {
  /**
   * Provider type identifier.
   */
  type: 'voltagent';

  /**
   * The dataset ID in VoltOps.
   */
  datasetId?: string;

  /**
   * The dataset name in VoltOps (alternative to datasetId).
   */
  datasetName?: string;

  /**
   * Specific version ID to use. If not provided, uses the latest version.
   */
  versionId?: string;

  /**
   * Authentication configuration.
   */
  auth?: VoltagentAuthConfig;
}

/**
 * Configuration for defineVoltagentDataset().
 */
export interface VoltagentDatasetConfig {
  /**
   * Display name for the dataset.
   */
  name: string;

  /**
   * The dataset ID in VoltOps.
   */
  id?: string;

  /**
   * Specific version ID to use. If not provided, uses the latest version.
   */
  versionId?: string;

  /**
   * Maximum number of items to fetch from VoltOps.
   */
  limit?: number;

  /**
   * Description of the dataset.
   */
  description?: string;

  /**
   * Cache strategy for fetched data.
   *
   * - 'local': Cache to local filesystem (default)
   * - 'memory': Keep in memory only
   * - 'none': Always fetch fresh from VoltOps
   *
   * @default 'local'
   */
  cache?: 'local' | 'memory' | 'none';

  /**
   * Authentication configuration. If not provided, uses environment variables.
   */
  auth?: VoltagentAuthConfig;
}

/**
 * Mapped VoltAgent dataset item with Viteval-compatible structure.
 */
export type VoltagentDataItem<INPUT = unknown, OUTPUT = unknown> = DataItem<
  INPUT,
  OUTPUT,
  VoltagentExtra
>;

/**
 * VoltAgent ExperimentDatasetItem type (from @voltagent/sdk).
 * This mirrors the structure from @voltagent/evals.
 */
export interface ExperimentDatasetItem<
  Input = unknown,
  Expected = unknown,
  Extra extends Record<string, unknown> | null | undefined = Record<
    string,
    unknown
  > | null,
> {
  /**
   * Unique identifier for the item.
   */
  id: string;

  /**
   * Optional label for the item.
   */
  label?: string | null;

  /**
   * The input data.
   */
  input: Input;

  /**
   * The expected output (ground truth).
   */
  expected?: Expected;

  /**
   * Additional fields.
   */
  extra?: Extra;

  /**
   * The dataset ID.
   */
  datasetId?: string;

  /**
   * The dataset version ID.
   */
  datasetVersionId?: string;

  /**
   * The dataset name.
   */
  datasetName?: string;

  /**
   * Dataset metadata.
   */
  dataset?: {
    id?: string;
    versionId?: string;
    name?: string;
    description?: string;
    metadata?: Record<string, unknown> | null;
  };

  /**
   * Additional metadata.
   */
  metadata?: Record<string, unknown> | null;

  /**
   * Raw data from the API.
   */
  raw?: unknown;
}
