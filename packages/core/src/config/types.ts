import type { OpenAI } from 'openai';
import type { UserConfig } from 'vite';
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

export type VitevalReporterBraintrust = {
  type: 'braintrust';
  apiKey: string;
};

export type VitevalReporter = 'console' | 'json' | VitevalReporterBraintrust;

/**
 * Viteval configuration.
 */
export interface VitevalConfig {
  /**
   * Provider configuration, used to initialize the provider for usage across the tests and evals (OpenAI ONLY).
   */
  provider?: VitevalProviderConfig;
  /**
   * Reporter configuration.
   *
   * @default 'console'
   */
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
  resolve?: UserConfig['resolve'];
}
