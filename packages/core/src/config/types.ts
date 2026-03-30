import type { AliasOptions, UserConfig } from 'vite';
import type { DebuggerOptions, DepsHandlingOptions } from 'vite-node';
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
   */
  server?: {
    /**
     * Sourcemap options.
     */
    sourcemap?: boolean | 'inline';
    /**
     * Deps handling options.
     */
    deps?: DepsHandlingOptions;
    /**
     * Debug options.
     */
    debug?: DebuggerOptions;
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
