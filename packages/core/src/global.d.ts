import type { OpenAI } from 'openai';

declare global {
  // biome-ignore lint: used by provider internals
  var __client: OpenAI | undefined;
}
