# Core Concepts

Understanding these core concepts will help you make the most of Viteval.

## Evaluations

An evaluation is the fundamental unit in Viteval. It defines:

- **Data**: The input-expected output pairs to test
- **Task**: The function that generates output from input
- **Scorers**: How to measure the quality of outputs
- **Threshold**: The minimum score required to pass

```ts
import { evaluate, scorers } from 'viteval';

evaluate('Uppercase', {
  data: [{ input: 'hello', expected: 'HELLO' }],
  task: ({ input }) => input.toUpperCase(),
  scorers: [scorers.exactMatch()],
  threshold: 0.9,
});
```

## Data and Datasets

### Inline Data

For simple evaluations, define data directly:

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

### Local Datasets

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

### Remote Datasets

Initialize a dataset provider in native Vitest setup to use SQLite or Braintrust.
The `defineDataset()` API stays the same. See [Providers](./providers).

## Tasks

The task function is where your LLM logic lives. It receives input and should return the model's output:

```ts
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
  const result = await generateObject({
    model: openai('gpt-4.1-mini'),
    prompt: input,
    schema: z.object({
      answer: z.string(),
      confidence: z.number(),
    }),
  });
  return JSON.stringify(result.object);
};
```

## Scorers

Scorers measure the quality of your model's output against the expected result.

### Built-in Scorers

Viteval provides many pre-built scorers:

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
scorers.sql(); // SQL validation
```

### Custom Scorers

Create custom scorers for specific needs:

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

### Multiple Scorers

Combine multiple scorers for comprehensive evaluation:

```ts
evaluate('Comprehensive test', {
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

Thresholds determine when an evaluation passes or fails:

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
