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
