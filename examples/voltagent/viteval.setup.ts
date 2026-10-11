import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { openai } from '@ai-sdk/openai';
import { initializeModel } from 'viteval';

const envFile = new URL('.env', import.meta.url);
if (existsSync(envFile)) {
  loadEnvFile(envFile);
}

initializeModel({
  language: openai('gpt-4o-mini'),
});
