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

evaluate('Uppercase', {
  data: [{ input: 'hello', expected: 'HELLO' }],
  task: ({ input }) => input.toUpperCase(),
  scorers: [scorers.exactMatch()],
  threshold: 0.9,
});
```

## Data and datasets

### Inline data

Define cases inline for a small evaluation:

```ts
evaluate('Simple eval', {
  data: async () => [
    { input: 'Hello', expected: 'Hi there!' },
    { input: 'Goodbye', expected: 'See you later!' },
  ],
  task: ({ input }) => (input === 'Hello' ? 'Hi there!' : 'See you later!'),
  scorers: [scorers.exactMatch()],
});
```

### Local datasets

For reusable datasets, use `defineDataset()`:

```ts
import { defineDataset } from 'viteval/dataset';

const greetings = defineDataset({
  name: 'greetings',
  data: async () => {
    // Generate or load data
    return [
      { input: 'Hello', expected: 'Hi there!' },
      { input: 'Goodbye', expected: 'See you later!' },
    ];
  },
});

// Use in evaluations
evaluate('Greeting test', {
  data: greetings,
  task: ({ input }) => (input === 'Hello' ? 'Hi there!' : 'See you later!'),
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
import { generateText, Output } from 'ai';
import { z } from 'zod';

// Simple text generation
task: async ({ input }) => {
  const result = await generateText({
    model: openai('gpt-4.1-mini'),
    prompt: input,
  });
  return result.text;
};

// With system prompts
task: async ({ input }) => {
  const result = await generateText({
    model: openai('gpt-4.1-mini'),
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: input },
    ],
  });
  return result.text;
};

// Structured output
task: async ({ input }) => {
  const result = await generateText({
    model: openai('gpt-4.1-mini'),
    prompt: input,
    output: Output.object({
      schema: z.object({
        answer: z.string(),
        confidence: z.number(),
      }),
    }),
  });
  return JSON.stringify(result.output);
};
```

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

const lengthScorer = createScorer<string>({
  name: 'length-check',
  score: ({ output, expected }) => {
    const outputLength = output.length;
    const expectedLength = expected.length;
    const diff = Math.abs(outputLength - expectedLength);
    return {
      score: Math.max(0, 1 - diff / Math.max(1, outputLength, expectedLength)),
    };
  },
});

// Use in evaluations
evaluate('Length test', {
  data: [{ input: 'hello', expected: 'HELLO' }],
  task: ({ input }) => input.toUpperCase(),
  scorers: [lengthScorer],
});
```

### Multiple scorers

Combine scorers to check different properties of the same output. This example
uses LLM judges and embeddings, which require model setup and API credentials:

```ts
evaluate('Answer quality', {
  data: [{ input: 'What color is the sky?', expected: 'Blue' }],
  task: () => 'Blue',
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
evaluate('My test', {
  data: [{ input: 'hello', expected: 'HELLO' }],
  task: ({ input }) => input.toUpperCase(),
  scorers: [scorers.exactMatch()],
  threshold: 0.8, // Require 80% average score across all scorers
});
```

For each case, the threshold applies to the configured mean, median, or sum across
its scorer results. Null scores count as zero. Scorer/task failures and timeouts
fail the case and appear in the report. Suite summaries describe those outcomes;
they do not replace the per-case gate.
