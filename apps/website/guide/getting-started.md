# Getting Started

Run a passing evaluation, save its JSON report, and inspect it locally. Requires Node >=26.

## What is Viteval?

Viteval is an LLM evaluation framework powered by Vitest that makes it easy to:

- Define and run evaluations with a familiar, Vitest-like API
- Create and manage datasets locally or remotely
- Use built-in scorers or create custom ones
- Integrate evaluations into your CI/CD pipeline

## Installation

Install Viteval using your preferred package manager:

::: code-group

```bash [npm]
npm install viteval
```

```bash [pnpm]
pnpm add viteval
```

```bash [yarn]
yarn add viteval
```

:::

## Initialize a Viteval Project

::: code-group

```bash [npm]
npx viteval init
```

```bash [pnpm]
pnpm viteval init
```

```bash [yarn]
yarn viteval init
```

:::

This creates `vitest.config.ts`, `viteval.setup.ts`, and a passing `src/viteval.eval.ts` example. The setup file binds JSON dataset storage to the project root. In noninteractive environments, initialization skips the env-file prompt; use `--env-file` to create it explicitly.

## Your First Evaluation

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

### Running Your Evaluation

Run your evaluation using the Viteval CLI:

```bash
pnpm exec viteval run
```

This will:

1. Discover the files matched by your native Vitest configuration
2. Execute each evaluation
3. Display results with scoring details
4. Exit with a non-zero code if any evaluation fails

### Understanding the Results

Vitest reports two passing cases. The JSON reporter saves inputs, outputs, scores,
and execution diagnostics under `.viteval/results`. Inspect them with:

```bash
pnpm exec viteval ui
```

## Your First Dataset

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

### Adding the Dataset to the Evaluation

You can then use the dataset in the evaluation by importing it and passing it to the `data` option.

```ts
import { evaluate, scorers } from 'viteval';
import dataset from './uppercase.dataset';

evaluate('Uppercase dataset', {
  data: dataset,
  task: ({ input }) => input.toUpperCase(),
  scorers: [scorers.exactMatch()],
});
```

### Running the Evaluation with the Dataset

Now you can run the evaluation again, and it will use the dataset.

```bash
pnpm exec viteval data
pnpm exec viteval run
```

If you configured the dataset to be stored locally, it will be stored in the `./.viteval/datasets` directory relative to the project root.

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

## Next Steps

Now that you have your first evaluation running:

- [Learn about core concepts](/guide/concepts) like datasets, scorers, and tasks
- [Explore the CLI options](/guide/cli) for different use cases
- [Check out examples](/examples/) for more complex scenarios
- [Set up CI integration](/guide/advanced/ci) to run evaluations automatically
