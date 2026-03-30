import type { OpenAI } from 'openai';
import { initializeProvider } from '#/provider/initialize';

/**
 * Get the client for the provider.
 *
 * @returns The client for the provider.
 */
export function getClient(): OpenAI | null {
  try {
    if (globalThis.__client) {
      return globalThis.__client as unknown as OpenAI;
    }

    // Attempt to initialize the provider
    initializeProvider();

    return globalThis.__client as unknown as OpenAI;
  } catch {
    return null;
  }
}

/**
 * Get the client for the provider, throwing if not initialized.
 *
 * @returns The initialized OpenAI client.
 * @throws If the client has not been initialized via `initializeProvider()`.
 */
export function requireClient(): OpenAI {
  const client = getClient();
  if (!client) {
    throw new Error('OpenAI client not initialized. Call initializeProvider() first.');
  }
  return client;
}
