import type { EmbeddingModel, LanguageModel } from 'ai';
import type { AliasOptions, UserConfig } from 'vite';
import type { DepsOptimizationOptions } from 'vitest/node';

/**
 * Provider configuration for LLM-based scorers.
 *
 * Uses Vercel AI SDK models — bring your own provider package
 * (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, etc.).
 *
 * @example
 * ```ts
 * import { openai } from '@ai-sdk/openai';
 *
 * const provider: VitevalProviderConfig = {
 *   model: openai('gpt-4o-mini'),
 *   embeddingModel: openai.embedding('text-embedding-3-small'),
 * };
 * ```
 */
export interface VitevalProviderConfig {
  /**
   * Language model used for LLM-as-judge scorers.
   */
  model: LanguageModel;
  /**
   * Embedding model used for embedding-based scorers (e.g. `embeddingSimilarity`, `answerSimilarity`).
   *
   * Only required if you use embedding scorers.
   */
  embeddingModel?: EmbeddingModel;
}

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
   * Provider configuration for LLM-based and embedding-based scorers.
   *
   * @example
   * ```ts
   * import { openai } from '@ai-sdk/openai';
   *
   * defineConfig({
   *   provider: {
   *     model: openai('gpt-4o-mini'),
   *     embeddingModel: openai.embedding('text-embedding-3-small'),
   *   },
   * });
   * ```
   */
  provider?: VitevalProviderConfig;
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
