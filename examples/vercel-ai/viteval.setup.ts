import { openai } from '@ai-sdk/openai';
import dotenv from 'dotenv';
import { initializeProvider } from 'viteval';

dotenv.config({ path: './.env', quiet: true });

initializeProvider({
  embeddingModel: openai.embedding('text-embedding-3-small'),
  model: openai('gpt-4o-mini'),
});
