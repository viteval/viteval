# Examples

This section provides practical examples of using Viteval for different scenarios.

## Basic Text Evaluation

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

## Custom Dataset

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

## Multiple Scorers

```ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { evaluate, initializeModel, scorers } from 'viteval';

const model = openai('gpt-4.1-mini');
initializeModel({
  language: model,
  embedding: openai.embedding('text-embedding-3-small'),
});

evaluate('Content quality', {
  data: [{ input: 'What is the Sun?', expected: 'The Sun is a star.' }],
  task: async ({ input }) =>
    (await generateText({ model, prompt: input })).text,
  scorers: [
    scorers.factual(),
    scorers.answerSimilarity(),
    scorers.moderation(),
  ],
  threshold: 0.8, // an average of the scores is used to determine if threshold is met
});
```

The multiple-scorer example requires `ai`, `@ai-sdk/openai`, and
`OPENAI_API_KEY`. It performs real generation, embedding, and judge requests.

## Runnable Examples

There are a number of examples available in the [Viteval GitHub repository](https://github.com/viteval/viteval/tree/main/examples).

<div class="examples-grid">

[**Basic Evaluation**](https://github.com/viteval/viteval/tree/main/examples/basic)
Basic evaluation with Viteval

[**Vercel AI SDK**](https://github.com/viteval/viteval/tree/main/examples/vercel-ai)
Real-world evaluation with Vercel AI SDK

[**Voltagent**](https://github.com/viteval/viteval/tree/main/examples/voltagent)
Real-world evaluation with Voltagent

</div>

<style>
.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.examples-grid a {
  display: block;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-decoration: none;
  transition: border-color 0.3s;
}

.examples-grid a:hover {
  border-color: var(--vp-c-brand);
}
</style>
