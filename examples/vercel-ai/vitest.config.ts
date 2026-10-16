import path from 'node:path';
import { defineConfig } from 'viteval/config';
import { JsonReporter } from 'viteval/reporters';

export default defineConfig({
  test: {
    include: ['src/**/*.eval.ts'],
    reporters: [
      'default',
      new JsonReporter({ outputFile: '.viteval/results/<run>.json' }),
    ],
    setupFiles: ['./viteval.setup.ts'],
  },
  resolve: {
    alias: {
      '#': path.resolve(import.meta.dirname, 'src'),
      '#models': path.resolve(import.meta.dirname, 'src/models'),
    },
  },
});
