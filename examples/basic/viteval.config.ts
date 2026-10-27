import { defineConfig } from 'viteval/config';
import { createJsonProvider } from 'viteval';
import './env';

export default defineConfig({
  eval: {
    include: ['src/**/*.eval.ts'],
    results: ['json'],
  },
  providers: [createJsonProvider({ root: import.meta.dirname })],
});
