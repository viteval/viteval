# Examples

These examples cover deterministic checks, generated datasets, and model-based
scoring. The first two run without an API key.

## Basic text evaluation

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

## Custom dataset

```ts
import { defineDataset } from 'viteval/dataset';
import { evaluate, scorers } from 'viteval';

const mathDataset = defineDataset({
  name: 'basic-math',
  data: async () =>
    Array.from({ length: 10 }, (_, index) => ({
      input: { a: index, b: 2 },
      expected: index + 2,
    })),
});

evaluate('Math solver', {
  data: mathDataset,
  task: ({ input }) => input.a + input.b,
  scorers: [scorers.exactMatch()],
});
```

## Multiple scorers

Install `ai` and `@ai-sdk/openai`, and provide `OPENAI_API_KEY` in the environment.
Initialize the judge and embedding models in the setup file registered by your
Vitest configuration:

```ts [viteval.setup.ts]
import { openai } from '@ai-sdk/openai';
import { initializeModel } from 'viteval';

initializeModel({
  language: openai('gpt-4.1-mini'),
  embedding: openai.embedding('text-embedding-3-small'),
});
```

Keep any existing provider initialization in that setup file. Then add the eval:

```ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { evaluate, scorers } from 'viteval';

const model = openai('gpt-4.1-mini');

evaluate('Content quality', {
  data: [{ input: 'What is the Sun?', expected: 'The Sun is a star.' }],
  task: async ({ input }) =>
    (await generateText({ model, prompt: input })).text,
  scorers: [
    scorers.factual(),
    scorers.answerSimilarity(),
    scorers.moderation(),
  ],
  threshold: 0.8,
});
```

The threshold applies to the mean of the three scores. This example performs
real generation, embedding, and judge requests.

## Runnable examples

The [repository examples](https://github.com/viteval/viteval/tree/main/examples)
include project configuration and setup files:

- [Basic Evaluation](https://github.com/viteval/viteval/tree/main/examples/basic): deterministic evaluations without API keys.
- [Vercel AI SDK](https://github.com/viteval/viteval/tree/main/examples/vercel-ai): model-backed evaluations with the AI SDK.
- [VoltAgent](https://github.com/viteval/viteval/tree/main/examples/voltagent): evaluations for agent workflows.
