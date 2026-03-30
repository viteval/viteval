import path from 'node:path';
import { defineConfig } from 'viteval/config';

export default defineConfig({
  eval: {
    include: ['src/**/*.eval.ts'],
    setupFiles: ['./viteval.setup.ts'],
  },
  resolve: {
    alias: {
      '#': path.resolve(import.meta.dirname, 'src'),
      '#models': path.resolve(import.meta.dirname, 'src/models'),
    },
  },
});
