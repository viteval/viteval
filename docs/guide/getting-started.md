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

Init generates a small uppercase-string smoke test. Replace its contents with
this order-ID extraction check; it also needs no API key:

```ts
import { evaluate, scorers } from 'viteval';

evaluate('Order extraction', {
  data: [
    { input: 'Where is order ORD-1042?', expected: 'ORD-1042' },
    { input: 'Please cancel ord-2087.', expected: 'ORD-2087' },
    { input: 'How do I update my address?', expected: '' },
  ],
  task: ({ input }) => input.match(/\bORD-\d+\b/i)?.[0].toUpperCase() ?? '',
  scorers: [scorers.exactMatch()],
});
```

### Running your evaluation

Run the evaluation:

```bash
pnpm exec viteval run
```

The command:

1. Discovers the files matched by your native Vitest configuration
2. Executes each evaluation
3. Displays Vitest test results
4. Exits with a non-zero code if any evaluation fails

### Understanding the results

Vitest reports three passing cases. The JSON reporter saves inputs, outputs, scores,
and execution diagnostics under `.viteval/results`. Inspect them with:

```bash
pnpm exec viteval ui
```

Remove the regular expression’s `i` flag and run again. The lowercase ID now
produces an empty string, scores 0, and fails the default threshold of 1. Restore
the flag before continuing. These cases check normalization and missing values;
they do not establish extraction accuracy on arbitrary support messages.

## Your first dataset

Create `src/order-extraction.dataset.ts`:

```ts
import { defineDataset } from 'viteval/dataset';

export default defineDataset({
  name: 'order-extraction',
  data: async () => [
    { input: 'Where is order ORD-1042?', expected: 'ORD-1042' },
    { input: 'Please cancel ord-2087.', expected: 'ORD-2087' },
    { input: 'How do I update my address?', expected: '' },
  ],
});
```

### Adding the dataset to the evaluation

Import the dataset and pass it to `data`:

```ts
import { evaluate, scorers } from 'viteval';
import dataset from './order-extraction.dataset';

evaluate('Order extraction', {
  data: dataset,
  task: ({ input }) => input.match(/\bORD-\d+\b/i)?.[0].toUpperCase() ?? '',
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

Replace the deterministic task with a model call in `src/viteval.eval.ts`.
Keep the same dataset so the two implementations face the same checks:

```ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { evaluate, scorers } from 'viteval';
import dataset from './order-extraction.dataset';

evaluate('Model order extraction', {
  data: dataset,
  task: async ({ input }) => {
    const result = await generateText({
      model: openai('gpt-4.1-mini'),
      system:
        'Extract the ORD- order ID. Return only the uppercase ID, or an empty string if none is present.',
      prompt: input,
    });
    return result.text.trim();
  },
  scorers: [scorers.exactMatch()],
});
```

This example makes three model requests and requires `OPENAI_API_KEY`. It is not
guaranteed to pass: extra explanation or an invented ID fails exact matching. Built-in
LLM judges also require `initializeModel()` in worker setup. See [Configuration](/api/configuration).

## Next steps

For more detail:

- [Core concepts](/guide/concepts): datasets, scorers, and tasks
- [CLI usage](/guide/cli): file filters, dataset generation, and the dashboard
- [Examples](/examples/): deterministic and model-backed evaluations
- [CI integration](/guide/advanced/ci): automated runs and saved reports
