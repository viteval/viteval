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

evaluate('My Evaluation', {
  data: async () => [/* test cases */],
  task: async (input) => {/* your LLM call */},
  scorers: [scorers.exactMatch],
  threshold: 0.9,
});
```

## Data and Datasets

### Inline Data

For simple evaluations, define data directly:

```ts
evaluate('Simple eval', {
  data: async () => [
    { input: "Hello", expected: "Hi there!" },
    { input: "Goodbye", expected: "See you later!" },
  ],
  // ...
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
      { input: "Hello", expected: "Hi there!" },
      { input: "Goodbye", expected: "See you later!" },
    ];
  },
});

// Use in evaluations
evaluate('Greeting test', {
  data: () => greetings.data(),
  // ...
});
```

### Remote Datasets

Coming soon!

## Tasks

The task function is where your LLM logic lives. It receives input and should return the model's output:

```ts
// Simple text generation
task: async (input) => {
  const result = await generateText({
    model: 'gpt-4',
    prompt: input,
  });
  return result.text;
}

// With system prompts
task: async (input) => {
  const result = await generateText({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: input },
    ],
  });
  return result.text;
}

// Structured output
task: async (input) => {
  const result = await generateObject({
    model: 'gpt-4',
    prompt: input,
    schema: z.object({
      answer: z.string(),
      confidence: z.number(),
    }),
  });
  return JSON.stringify(result.object);
}
```

## Scorers

Scorers measure the quality of your model's output against the expected result.

### Built-in Scorers

Viteval provides many pre-built scorers:

```ts
import { scorers } from 'viteval';

// Text similarity
scorers.levenshtein    // Edit distance
scorers.exactMatch     // Exact string match
scorers.answerSimilarity // Semantic similarity

// Content quality
scorers.factual        // Factual accuracy
scorers.summary        // Summary quality
scorers.translation    // Translation accuracy

// Safety and moderation
scorers.moderation     // Content safety

// Structured data
scorers.jsonDiff       // JSON comparison
scorers.sql           // SQL validation
```

### Custom Scorers

Create custom scorers for specific needs:

```ts
import { createScorer } from 'viteval';

const lengthScorer = createScorer({
  name: 'length-check',
  score: ({ output, expected }) => {
    const outputLength = output.length;
    const expectedLength = expected.length;
    const diff = Math.abs(outputLength - expectedLength);
    return Math.max(0, 1 - diff / Math.max(outputLength, expectedLength));
  },
});

// Use in evaluations
evaluate('Length test', {
  // ...
  scorers: [lengthScorer],
});
```

### Multiple Scorers

Combine multiple scorers for comprehensive evaluation:

```ts
evaluate('Comprehensive test', {
  // ...
  scorers: [
    scorers.factual,      // Is it factually correct?
    scorers.answerSimilarity, // Is it semantically similar?
    scorers.moderation,   // Is it safe content?
    customScorer,         // Custom business logic
  ],
  threshold: 0.8, // All scorers must average >= 0.8
});
```

## Thresholds

Thresholds determine when an evaluation passes or fails:

```ts
evaluate('My test', {
  // ...
  threshold: 0.8, // Require 80% average score across all scorers
});
```

For multiple scorers, the threshold applies to the average score across all scorers.
