/**
 * Configuration for the Braintrust provider.
 */
export interface BraintrustProviderOptions {
  /**
   * Braintrust API key.
   *
   * Falls back to `BRAINTRUST_API_KEY` environment variable.
   */
  apiKey?: string;
  /**
   * Braintrust project name.
   *
   * The provider resolves this to a `project_id` on initialization,
   * creating the project if it doesn't exist.
   */
  project: string;
  /**
   * Custom API base URL.
   *
   * @default 'https://api.braintrust.dev'
   */
  baseUrl?: string;
}
