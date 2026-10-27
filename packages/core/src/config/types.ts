import type { createProviderRegistry } from 'ai';
import type { Provider } from '#/provider/types';
import type {
  DatasetProviderName,
  ResultProviderName,
} from '#/provider/registry';
import type { ScorerAggregationType } from '#/types';

/** An unmodified AI SDK provider. Viteval does not own SDK clients. */
export type ModelProvider = Parameters<
  typeof createProviderRegistry
>[0][string];

/** A model reference resolved by the registered AI SDK provider. */
export type ModelId = `${string}:${string}`;

/** Evaluation defaults owned by Viteval, independent of the internal runner. */
export interface EvalOptions {
  timeout?: number;
  concurrency?: number;
  retries?: number;
  threshold?: number;
  aggregation?: ScorerAggregationType;
  results?: readonly ResultProviderName[];
}

/** Public V1 project configuration. */
export interface VitevalConfig {
  root?: string;
  eval?: EvalOptions & {
    include?: string[];
    exclude?: string[];
  };
  dataset?: {
    providers?: readonly DatasetProviderName[];
  };
  models?: {
    providers: readonly ModelProvider[];
    defaults?: {
      language?: ModelId;
      embedding?: ModelId;
    };
  };
  providers?: readonly Provider[];
}
