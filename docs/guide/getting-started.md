# Getting started

Run a passing evaluation, save its JSON report, and inspect it locally. Requires Node >=26.

> [!NOTE]
> V1 is currently a release candidate. Install `viteval@rc`; untagged installs
> still resolve to v0. V0 support ends when v1 launches.

## What is Viteval?

Viteval runs LLM evaluations as Vitest tests. Each evaluation combines test cases,
a task function, and scorers. You can:

- Run evaluations with native Vitest configuration and CLI options
- Store datasets as JSON or use an optional provider
- Use built-in scorers or write your own
- Fail a CI job when an evaluation fails

## Installation

Install the release candidate:

```bash [npm]
npm install --save-dev viteval@rc
```

```bash [pnpm]
pnpm add -D viteval@rc
```

```bash [yarn]
yarn add --dev viteval@rc
```

## Initialize a Viteval project

```bash [npm]
npx viteval init
```

```bash [pnpm]
pnpm exec viteval init
```

```bash [yarn]
yarn viteval init
```

This creates `vitest.config.ts` for ESM projects (`vitest.config.mts` for CommonJS),
`viteval.setup.ts`, and a passing `src/viteval.eval.ts` example. Existing
configuration is preserved; if you already have a Vitest config, follow the
printed instructions to register the setup file and reporter.

The setup file binds JSON dataset storage to the project root. In noninteractive
environments, initialization skips the env-file prompt; use `--create-env-file`
to create it explicitly, or `--no-env-file` to skip it locally.

## Your first evaluation

The generated `src/viteval.eval.ts` needs no API key:

```ts
import { evaluate, scorers } from 'viteval';

evaluate('Uppercase', {
  data: [
    { input: 'hello', expected: 'HELLO' },
    { input: 'world', expected: 'WORLD' },
  ],
  task: ({ input }) => input.toUpperCase(),
  scorers: [scorers.exactMatch()],
});
```

### Running your evaluation

Run the generated example:

```bash
pnpm exec viteval run
```

The command:

1. Discovers the files matched by your native Vitest configuration
2. Executes each evaluation
3. Displays Vitest test results
4. Exits with a non-zero code if any evaluation fails

### Understanding the results

Vitest reports two passing cases. The JSON reporter saves inputs, outputs, scores,
and execution diagnostics under `.viteval/results`. Inspect them with:

```bash
pnpm exec viteval ui
```

## Your first dataset

Create `src/uppercase.dataset.ts`:

```ts
import { defineDataset } from 'viteval/dataset';

export default defineDataset({
  name: 'uppercase',
  data: async () => [
    { input: 'hello', expected: 'HELLO' },
    { input: 'world', expected: 'WORLD' },
  ],
});
```

### Adding the dataset to the evaluation

Import the dataset and pass it to `data`:

```ts
import { evaluate, scorers } from 'viteval';
import dataset from './uppercase.dataset';

evaluate('Uppercase dataset', {
  data: dataset,
  task: ({ input }) => input.toUpperCase(),
  scorers: [scorers.exactMatch()],
});
```

### Running the evaluation with the dataset

Save the dataset, then run the evaluation:

```bash
pnpm exec viteval data
pnpm exec viteval run
```

With the generated JSON provider setup, local datasets live in `.viteval/datasets`
under the project root.

## Evaluate a model

Install an AI client and configure its credentials in your environment:

```bash
pnpm add ai @ai-sdk/openai
```

Create `src/colors.eval.ts`:

```ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { evaluate, scorers } from 'viteval';

evaluate('Color answers', {
  data: [
    {
      input: 'What color is the sky on a clear day? Reply with one word.',
      expected: 'Blue',
    },
  ],
  task: async ({ input }) => {
    const result = await generateText({
      model: openai('gpt-4.1-mini'),
      prompt: input,
    });
    return result.text;
  },
  scorers: [scorers.levenshtein()],
  threshold: 0.8,
});
```

This example makes a real model request and requires `OPENAI_API_KEY`. Built-in
LLM judges also require `initializeModel()` in worker setup. See [Configuration](/api/configuration).

## Next steps

For more detail:

- [Core concepts](/guide/concepts): datasets, scorers, and tasks
- [CLI usage](/guide/cli): file filters, dataset generation, and the dashboard
- [Examples](/examples/): deterministic and model-backed evaluations
- [CI integration](/guide/advanced/ci): automated runs and saved reports
