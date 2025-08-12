import type { ProviderConfig } from '#/internals/provider';

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
  provider?: ProviderConfig;
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
}
