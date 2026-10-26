# Configuration

Configure Viteval in `vitest.config.ts` using Vitest's `test` options. Initialize
models and storage providers in a worker setup file.

## Import

```ts
import { defineConfig } from 'viteval/config';
import { JsonReporter } from 'viteval/reporters';
```

## Configuration file

Create a `vitest.config.ts` file in your project root:

```ts
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
    testTimeout: 100_000,
  },
});
```

`viteval/config` re-exports Vitest's `defineConfig`. Use the standard
[Vitest configuration options](https://vitest.dev/config/).

## Models and providers

Initialize non-serializable models and Viteval providers in a setup file. Vitest executes setup files in each worker before collecting evaluations.

```ts
import { fileURLToPath } from 'node:url';
import { openai } from '@ai-sdk/openai';
import { initializeModel } from 'viteval';
import { createJsonProvider, initializeProvider } from 'viteval/provider';

initializeModel({
  language: openai('gpt-4.1-mini'),
  embedding: openai.embedding('text-embedding-3-small'),
});
const providerResult = await initializeProvider({
  datasets: createJsonProvider({
    root: fileURLToPath(new URL('.', import.meta.url)),
  }),
});
if (!providerResult.ok) throw providerResult.error;
```

`initializeModel()` is synchronous and configures the model used by LLM-based
scorers. Deterministic scorers need no model. See [Providers](/guide/providers)
for SQLite and Braintrust setup.

## Evaluation files

Use Vitest's `test.include` and `test.exclude` options:

```ts
export default defineConfig({
  test: {
    include: ['src/**/*.eval.ts', 'evaluations/**/*.ts'],
    exclude: ['**/*.draft.eval.ts', 'src/experimental/**'],
  },
});
```

## Timeouts

Set the default with Vitest's `test.testTimeout`. Pass native `testOptions` to override it for one evaluation suite.

```ts
export default defineConfig({
  test: {
    testTimeout: 300_000,
  },
});
```

```ts
evaluate('slow evaluation', {
  data,
  scorers,
  task,
  testOptions: { timeout: 600_000 },
});
```

## Vite options

Set Vite options, including aliases and server settings, at the top level:

```ts
export default defineConfig({
  resolve: {
    alias: {
      '#': new URL('./src', import.meta.url).pathname,
    },
  },
});
```
