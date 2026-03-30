import type { AliasOptions, UserConfig } from 'vite';
import type { DepsOptimizationOptions } from 'vitest/node';
import type { ModelConfig } from '#/model/types';
import type { ProviderConfig } from '#/provider/types';

// TODO: Add support for braintrust reporter
// Export type VitevalReporterBraintrust = {
//   Type: 'braintrust';
//   ApiKey: string;
// };

// TODO: Add support via the config file for reporter
export type VitevalReporter = 'default' | 'json' | 'file'; // | VitevalReporterBraintrust;

/**
 * Viteval configuration.
 */
export interface VitevalConfig {
  /**
   * Model configuration for LLM-based and embedding-based scorers.
   *
   * Accepts a `LanguageModel` directly (shorthand), or a config object
   * with `language` and optional `embedding` models.
   *
   * @example Shorthand
   * ```ts
   * import { openai } from '@ai-sdk/openai';
   *
   * defineConfig({
   *   model: openai('gpt-4o'),
   * });
   * ```
   *
   * @example Full config
   * ```ts
   * import { openai } from '@ai-sdk/openai';
   *
   * defineConfig({
   *   model: {
   *     language: openai('gpt-4o'),
   *     embedding: openai.embedding('text-embedding-3-small'),
   *   },
   * });
   * ```
   */
  model?: ModelConfig;
  /**
   * Provider for persisting datasets and evaluation runs.
   *
   * Accepts a single provider, or per-domain providers for composable setups.
   *
   * @example Single provider
   * ```ts
   * import { viteval } from '@viteval/providers';
   *
   * defineConfig({
   *   provider: viteval(),
   * });
   * ```
   *
   * @example Composable providers
   * ```ts
   * import { viteval } from '@viteval/providers';
   * import { braintrust } from '@viteval/providers/braintrust';
   *
   * defineConfig({
   *   provider: {
   *     datasets: viteval(),
   *     evals: braintrust({ project: 'my-project', apiKey: '...' }),
   *   },
   * });
   * ```
   */
  provider?: ProviderConfig;
  /**
   * Reporters to use.
   */
  reporters?: VitevalReporter[];
  /** @deprecated Use reporters instead */
  reporter?: VitevalReporter;
  /**
   * Test configuration.
   */
  eval?: {
    /**
     * Globs for eval files to include.
     */
    include?: string[];
    /**
     * Globs for eval files to exclude.
     */
    exclude?: string[];
    /**
     * Setup files to run before the evals.
     */
    setupFiles?: string[];
    /**
     * Timeout for evals.
     */
    timeout?: number;
  };
  /**
   * Server configuration.
   *
   * Aligns with Vitest 4's `test.server` options.
   */
  server?: {
    /**
     * Deps handling options for the Vite server.
     */
    deps?: {
      /** Externalized dependencies (bypassed to native Node). */
      external?: (string | RegExp)[];
      /** Inlined dependencies (processed by Vite). */
      inline?: (string | RegExp)[] | true;
      /** Try to guess the CJS version of a package when it's invalid ESM. */
      fallbackCJS?: boolean;
    };
    /**
     * Debug options for inspecting transformed test files.
     */
    debug?: {
      /** Folder where Vitest stores transformed test files. If `true`, uses `.vitest-dump`. */
      dump?: string | true;
      /** Load files from the dump folder instead of transforming. */
      load?: boolean;
    };
  };
  /**
   * Configuration for the deps optimizer.
   */
  deps?: {
    /**
     * Whether to use the interopDefault plugin.
     *
     * @default true
     */
    interopDefault?: boolean;
    /**
     * Optimizer options.
     */
    optimizer?: DepsOptimizationOptions;
  };
  /**
   * Vite plugins to use.
   */
  plugins?: UserConfig['plugins'];
  /**
   * Vite resolve configuration.
   */
  resolve?: {
    alias?: AliasOptions;
  };
}
