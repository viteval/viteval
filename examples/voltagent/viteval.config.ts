import { openai } from '@ai-sdk/openai';
import { defineConfig } from 'viteval/config';
import './env';

export default defineConfig({
  eval: {
    include: ['src/**/*.eval.ts'],
    results: ['json'],
  },
  models: {
    defaults: { language: 'openai:gpt-4o-mini' },
    providers: [openai],
  },
});
