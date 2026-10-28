# Examples

These examples cover deterministic checks, generated datasets, and model-based
scoring. The first two run without an API key.

## Extract order IDs

Check a deterministic extractor against casing differences and a missing ID.
Use these same cases when replacing the task with a model call.

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

## Reusable dataset

Generate valid IDs in both cases to check the normalization rule over more values.
This adds coverage of the ID format, not the variety of real customer messages.

```ts
import { defineDataset } from 'viteval/dataset';
import { evaluate, scorers } from 'viteval';

const orderMessages = defineDataset({
  name: 'order-id-casing',
  data: async () =>
    Array.from({ length: 10 }, (_, index) => {
      const id = `ORD-${1042 + index}`;
      return {
        input: `Please cancel ${index % 2 === 0 ? id : id.toLowerCase()}.`,
        expected: id,
      };
    }),
});

evaluate('Order ID casing', {
  data: orderMessages,
  task: ({ input }) => input.match(/\bORD-\d+\b/i)?.[0].toUpperCase() ?? '',
  scorers: [scorers.exactMatch()],
});
```

## Multiple scorers

Install `ai` and `@ai-sdk/openai`, and provide `OPENAI_API_KEY` in the environment.
Register the SDK provider and judge/embedding defaults in Viteval configuration:

```ts [viteval.config.ts]
import { openai } from '@ai-sdk/openai';
import { defineConfig } from 'viteval';

export default defineConfig({
  models: {
    providers: [openai],
    defaults: {
      language: 'openai:gpt-4.1-mini',
      embedding: 'openai:text-embedding-3-small',
    },
  },
});
```

Then add the eval:

```ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { evaluate, scorers } from 'viteval';

const model = openai('gpt-4.1-mini');

evaluate('Support policy answers', {
  data: [
    {
      input: 'Can I return an unopened item after 14 days?',
      expected: 'Unopened items can be returned within 30 days of delivery.',
    },
  ],
  task: async ({ input }) =>
    (
      await generateText({
        model,
        system:
          'Answer using this policy: unopened items can be returned within 30 days of delivery. Return shipping is paid by the customer.',
        prompt: input,
      })
    ).text,
  scorers: [
    scorers.factual(),
    scorers.answerSimilarity(),
    scorers.moderation(),
  ],
  threshold: 0.8,
});
```

The threshold applies to the mean of the three scores. This example performs
real generation, embedding, and judge requests. Judge scores vary by model and
are not proof that an answer follows your policy. For exact extraction checks,
use the [model-backed evaluation guide](/guide/models).

## Runnable examples

The [repository examples](https://github.com/viteval/viteval/tree/main/examples)
include project configuration and environment loading:

- [Basic Evaluation](https://github.com/viteval/viteval/tree/main/examples/basic): deterministic evaluations without API keys.
- [Vercel AI SDK](https://github.com/viteval/viteval/tree/main/examples/vercel-ai): model-backed evaluations with the AI SDK.
- [VoltAgent](https://github.com/viteval/viteval/tree/main/examples/voltagent): evaluations for agent workflows.
