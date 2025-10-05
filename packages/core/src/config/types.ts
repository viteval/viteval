import type { OpenAI } from 'openai';
import type { AliasOptions, UserConfig } from 'vite';
import type { DebuggerOptions, DepsHandlingOptions } from 'vite-node';
import type { DepsOptimizationOptions } from 'vitest/node';

export type VitevalProviderOpenAIConfig =
  | {
      apiKey: string;
      project?: string;
      organization?: string;
    }
  | { client: OpenAI };

export interface VitevalProviderConfig {
  openai: VitevalProviderOpenAIConfig;
}

// TODO: Add support for braintrust reporter
// export type VitevalReporterBraintrust = {
//   type: 'braintrust';
//   apiKey: string;
// };

// TODO: Add support via the config file for reporter
export type VitevalReporter =
  | 'default'
  | 'json'
  | 'file'
  | (string & {}); // custom reporter module path or name

/**
 * Viteval configuration.
 */
export interface VitevalConfig {
  /**
   * Provider configuration, used to initialize the provider for usage across the tests and evals (OpenAI ONLY).
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
