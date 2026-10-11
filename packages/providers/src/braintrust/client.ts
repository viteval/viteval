import type Braintrust from '@braintrust/api';
import { attemptAsync, err, isErr, ok, type Result } from 'massaman/control';
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
): () => Promise<Result<Braintrust>> {
  let client: Braintrust | undefined;

  return async () => {
    if (client) {
      return ok(client);
    }

    const importResult = await attemptAsync(() => import('@braintrust/api'));
    if (isErr(importResult)) {
      return err(
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
    const mod = importResult.value;
    const BraintrustClient = (mod.default ?? mod) as new (
      opts: ConstructorParameters<typeof Braintrust>[0]
    ) => Braintrust;

    client = new BraintrustClient({
      apiKey: options.apiKey,
      baseURL: options.baseUrl,
    });

    return ok(client);
  };
}
