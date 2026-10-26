# Core concepts

An evaluation runs a task against test cases and scores each output. Datasets
hold the cases; thresholds determine whether they pass.

## Evaluations

An evaluation defines:

- `data`: inputs and expected outputs
- `task`: the function that produces an output for each input
- `scorers`: functions that score the output
- `threshold`: the minimum aggregated score for a case to pass

```ts
import { evaluate, scorers } from 'viteval';

evaluate('Order extraction', {
  data: [{ input: 'Where is order ORD-1042?', expected: 'ORD-1042' }],
  task: ({ input }) => input.match(/\bORD-\d+\b/i)?.[0].toUpperCase() ?? '',
  scorers: [scorers.exactMatch()],
  threshold: 1,
});
```

## Data and datasets

### Inline data

Define cases inline for a small evaluation:

```ts
evaluate('Order extraction', {
  data: async () => [
    { input: 'Please cancel ord-2087.', expected: 'ORD-2087' },
    { input: 'How do I update my address?', expected: '' },
  ],
  task: ({ input }) => input.match(/\bORD-\d+\b/i)?.[0].toUpperCase() ?? '',
  scorers: [scorers.exactMatch()],
});
```

### Local datasets

For reusable datasets, use `defineDataset()`:

```ts
import { defineDataset } from 'viteval/dataset';

const orderMessages = defineDataset({
  name: 'order-extraction',
  data: async () => [
    { input: 'Please cancel ord-2087.', expected: 'ORD-2087' },
    { input: 'How do I update my address?', expected: '' },
  ],
});

evaluate('Order extraction', {
  data: orderMessages,
  task: ({ input }) => input.match(/\bORD-\d+\b/i)?.[0].toUpperCase() ?? '',
  scorers: [scorers.exactMatch()],
});
```

### Remote datasets

Initialize a dataset provider in native Vitest setup to use SQLite or Braintrust.
S3, Google Cloud Storage, Langfuse, and VoltOps are also supported within their
documented capabilities. The `defineDataset()` API stays the same. See
[Providers](./providers).

## Tasks

The task function receives a case's input and returns the output to score.
Call your model or application code inside this function:

```ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const extractOrderId = async ({ input }: { input: string }) => {
  const result = await generateText({
    model: openai('gpt-4.1-mini'),
    system:
      'Extract the ORD- order ID. Return only the uppercase ID, or an empty string if none is present.',
    prompt: input,
  });
  return result.text.trim();
};
```

Pass `extractOrderId` as the evaluation’s `task`. This requires `ai`,
`@ai-sdk/openai`, and `OPENAI_API_KEY`. Expected values go to scorers, not to the
task. For structured output, return the object and use `scorers.jsonDiff()`;
see [Scorers](/api/scorers#jsondiff).

## Scorers

Scorers receive the task output and expected value. Each returns a score and
optional metadata.

### Built-in scorers

Built-in scorers cover text matching, semantic similarity, and model-based judgments:

```ts
import { scorers } from 'viteval';

// Text similarity
scorers.levenshtein(); // Edit distance
scorers.exactMatch(); // Exact match
scorers.answerSimilarity(); // Semantic similarity

// Content quality
scorers.factual(); // Factual accuracy
scorers.summary(); // Summary quality
scorers.translation(); // Translation accuracy

// Safety and moderation
scorers.moderation(); // Content safety

// Structured data
scorers.jsonDiff(); // JSON comparison
scorers.sql(); // Judge whether two queries are equivalent; does not execute SQL
```

### Custom scorers

Use `createScorer()` for checks specific to your application:

```ts
import { createScorer } from 'viteval';

const orderIdScorer = createScorer<string>({
  name: 'normalized-order-id',
  score: ({ output, expected }) => ({
    score: output.trim().toUpperCase() === expected ? 1 : 0,
  }),
});

evaluate('Order extraction', {
  data: [{ input: 'Please cancel ord-2087.', expected: 'ORD-2087' }],
  task: ({ input }) => input.match(/\bORD-\d+\b/i)?.[0] ?? '',
  scorers: [orderIdScorer],
});
```

### Multiple scorers

Combine scorers to check different properties of the same output. This example
uses LLM judges and embeddings, which require model setup and API credentials:

```ts
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
        model: openai('gpt-4.1-mini'),
        system:
          'Unopened items can be returned within 30 days of delivery. Answer using only this policy.',
        prompt: input,
      })
    ).text,
  scorers: [
    scorers.factual(),
    scorers.answerSimilarity(),
    scorers.moderation(),
  ],
  threshold: 0.8, // All scorers must average >= 0.8
});
```

## Thresholds

Each case must meet the threshold to pass:

```ts
evaluate('Order extraction', {
  data: [{ input: 'Please cancel ord-2087.', expected: 'ORD-2087' }],
  task: ({ input }) => input.match(/\bORD-\d+\b/i)?.[0].toUpperCase() ?? '',
  scorers: [scorers.exactMatch()],
  threshold: 1,
});
```

For each case, the threshold applies to the configured mean, median, or sum across
its scorer results. Null scores count as zero. Scorer/task failures and timeouts
fail the case and appear in the report. Suite summaries describe those outcomes;
they do not replace the per-case gate.
