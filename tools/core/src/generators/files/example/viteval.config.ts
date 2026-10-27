import { defineConfig } from 'viteval/config';
import { JsonReporter } from 'viteval/reporters';

export default defineConfig({
  eval: {
    include: ['src/**/*.eval.ts'],
    reporters: [
      'default',
      new JsonReporter({ outputFile: '.viteval/results/<run>.json' }),
    ],
    setupFiles: ['./viteval.setup.ts'],
  },
});
