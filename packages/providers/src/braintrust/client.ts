import type Braintrust from '@braintrust/api';
import type { BraintrustProviderOptions } from './types';

/**
 * Lazily create and cache the Braintrust API client.
 *
 * Uses dynamic import so `@braintrust/api` is only loaded when actually used
 * (it's an optional peer dependency).
 *
 * @param options - Provider options.
 * @returns A factory that returns the cached Braintrust client.
 */
export function createBraintrustClient(
  options: BraintrustProviderOptions
): () => Promise<Braintrust> {
  let client: Braintrust | undefined;

  return async () => {
    if (client) {return client;}

    let BraintrustClient: new (
      opts: ConstructorParameters<typeof Braintrust>[0]
    ) => Braintrust;

    try {
      const mod = await import('@braintrust/api');
      BraintrustClient = (mod.default ?? mod) as typeof BraintrustClient;
    } catch {
      throw new Error(
        [
          'The Braintrust provider requires the "@braintrust/api" package.',
          '',
          'Install it with:',
          '  npm install @braintrust/api',
          '',
          'Then restart your eval.',
        ].join('\n')
      );
    }

    client = new BraintrustClient({
      apiKey: options.apiKey,
      baseURL: options.baseUrl,
    });

    return client;
  };
}
