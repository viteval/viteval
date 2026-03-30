import { openai } from '@ai-sdk/openai';
import dotenv from 'dotenv';
import { initializeModel } from 'viteval';

dotenv.config({ path: './.env', quiet: true });

initializeModel({
  embedding: openai.embedding('text-embedding-3-small'),
  language: openai('gpt-4o-mini'),
});
