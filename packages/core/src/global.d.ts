import type { OpenAI } from 'openai';

declare global {
  // Biome-ignore lint: used by provider internals
  var __client: OpenAI | undefined;
}
