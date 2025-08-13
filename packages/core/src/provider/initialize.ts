import { init as initAutoevals } from 'autoevals';
import { OpenAI } from 'openai';
import { match, P } from 'ts-pattern';
import type { VitevalProviderConfig } from '#/config/types';

/**
 * Initialize the provider.
 *
 * @param config - The provider config.
 * @returns The provider client.
 */
export function initializeProvider(config?: VitevalProviderConfig) {
  // If the client is already initialized, return
  if (globalThis.__client) {
    return;
  }

  const providerConfig = config ?? getProviderConfigFromEnv();

  if (!providerConfig) {
    throw new Error('No provider config found');
  }

  if (!providerConfig.openai) {
    throw new Error('No provider config found, only openai is supported');
  }

  const client = match(providerConfig.openai)
    .returnType<OpenAI | null>()
    .with({ client: P.not(P.nullish) }, ({ client }) => client)
    .with(
      { apiKey: P.not(P.nullish) },
      ({ apiKey, project, organization }) =>
        new OpenAI({
          apiKey,
          project,
          organization,
        })
    )
    .otherwise(() => null);

  if (!client) {
    throw new Error('No provider client found');
  }

  // @ts-expect-error - `init` is not typed correctly and using old version of openai
  initAutoevals({ client });
}

/*
|------------------
| Internals
|------------------
*/

function getProviderConfigFromEnv(): VitevalProviderConfig | null {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    return null;
  }

  return {
    openai: {
      apiKey: openaiApiKey,
      project: process.env.OPENAI_PROJECT ?? undefined,
      organization: process.env.OPENAI_ORGANIZATION ?? undefined,
    },
  };
}
