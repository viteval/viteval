import { defineConfig } from 'viteval/config';

export default defineConfig({
  eval: {
    include: ['src/**/*.eval.ts'],
    setupFiles: ['./viteval.setup.ts'],
  },
});
