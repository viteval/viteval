import { defineConfig } from 'viteval/config';

export default defineConfig({
  reporter: 'console',
  eval: {
    include: ['src/**/*.eval.ts'],
    setupFiles: ['./viteval.setup.ts'],
  },
});
