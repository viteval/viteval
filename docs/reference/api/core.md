# Core API

Reference for `evaluate` and `defineConfig` - the fundamental Viteval functions.

## Overview

The core API provides two main functions: `evaluate` for defining evaluation suites and `defineConfig` for configuring Viteval behavior.

---

## evaluate

Define and run an LLM evaluation suite.

### Signature

```ts
function evaluate<DATA extends Data>(name: string, config: Eval<DATA>): void;
```

### Parameters

| Parameter | Type         | Description                  |
| --------- | ------------ | ---------------------------- |
| `name`    | `string`     | Name of the evaluation suite |
| `config`  | `Eval<DATA>` | Evaluation configuration     |

### Eval Configuration

| Property      | Type                          | Default  | Description                             |
| ------------- | ----------------------------- | -------- | --------------------------------------- |
| `task`        | `Task`                        | required | Function to evaluate                    |
| `scorers`     | `Scorer[]`                    | required | Scoring functions                       |
| `data`        | `Data`                        | required | Test data (array, function, or Dataset) |
| `description` | `string`                      | -        | Optional description                    |
| `aggregation` | `'mean' \| 'median' \| 'sum'` | `'mean'` | Score aggregation method                |
| `threshold`   | `number`                      | `1.0`    | Pass threshold (0-1)                    |
| `timeout`     | `number`                      | `25000`  | Timeout per test in milliseconds        |

### Basic Example

```ts
import { evaluate, scorers } from 'viteval';

evaluate('Basic Evaluation', {
  task: async ({ input }) => {
    // Your LLM call here
    return await llm.generate(input);
  },
  scorers: [scorers.exactMatch],
  data: [{ input: 'Hello', expected: 'Hello' }],
});
```

### With All Options

```ts
import { evaluate, scorers, createScorer } from 'viteval';

evaluate('Full Evaluation', {
  description: 'Tests model accuracy on Q&A tasks',

  task: async ({ input, context }) => {
    return await llm.generate(`Context: ${context}\nQuestion: ${input}`);
  },

  scorers: [
    scorers.exactMatch,
    scorers.levenshtein,
    createScorer({
      name: 'length-check',
      score: ({ output, expected }) => ({
        score: output.length <= expected.length * 1.5 ? 1 : 0,
      }),
    }),
  ],

  data: [
    { input: 'What is 2+2?', expected: '4', context: 'math' },
    { input: 'Capital of France?', expected: 'Paris', context: 'geography' },
  ],

  aggregation: 'mean',
  threshold: 0.8,
  timeout: 30000,
});
```

### Task Function

The task function receives data item properties and returns the output to evaluate.

```ts
// Task signature
type Task<INPUT, OUTPUT, EXTRA> = (
  args: { input: INPUT } & EXTRA
) => Promise<OUTPUT> | OUTPUT;
```

```ts
// Simple task
evaluate('Simple', {
  task: async ({ input }) => input.toUpperCase(),
  scorers: [scorers.exactMatch],
  data: [{ input: 'hello', expected: 'HELLO' }],
});

// Task with extra context
evaluate('With Context', {
  task: async ({ input, systemPrompt }) => {
    return await llm.generate({
      system: systemPrompt,
      user: input,
    });
  },
  scorers: [scorers.exactMatch],
  data: [
    {
      input: 'Summarize this',
      expected: 'Summary here',
      systemPrompt: 'You are a summarizer',
    },
  ],
});
```

### Data Sources

Data can be provided in three ways:

```ts
// 1. Inline array
evaluate('Inline Data', {
  task: async ({ input }) => input,
  scorers: [scorers.exactMatch],
  data: [
    { input: 'a', expected: 'a' },
    { input: 'b', expected: 'b' },
  ],
});

// 2. Generator function
evaluate('Generated Data', {
  task: async ({ input }) => input,
  scorers: [scorers.exactMatch],
  data: async () => {
    const items = await fetchTestCases();
    return items.map((i) => ({ input: i.q, expected: i.a }));
  },
});

// 3. Dataset reference
import myDataset from './my.dataset';

evaluate('Dataset Reference', {
  task: async ({ input }) => input,
  scorers: [scorers.exactMatch],
  data: myDataset,
});
```

### Aggregation Methods

| Method   | Description                             |
| -------- | --------------------------------------- |
| `mean`   | Average of all scorer results (default) |
| `median` | Median of all scorer results            |
| `sum`    | Sum of all scorer results               |

```ts
evaluate('Median Aggregation', {
  task: async ({ input }) => input,
  scorers: [scorers.exactMatch, scorers.levenshtein],
  data: [{ input: 'test', expected: 'test' }],
  aggregation: 'median',
  threshold: 0.9,
});
```

---

## defineConfig

Configure Viteval behavior. Creates a Vitest-compatible configuration object.

### Signature

```ts
function defineConfig(config: VitevalConfig): VitestConfig;
```

### VitevalConfig

| Property    | Type                    | Description                |
| ----------- | ----------------------- | -------------------------- |
| `provider`  | `VitevalProviderConfig` | LLM provider configuration |
| `reporters` | `VitevalReporter[]`     | Output reporters           |
| `eval`      | `EvalConfig`            | Evaluation settings        |
| `server`    | `ServerConfig`          | Vite server options        |
| `deps`      | `DepsConfig`            | Dependency optimization    |
| `plugins`   | `Plugin[]`              | Vite plugins               |
| `resolve`   | `ResolveConfig`         | Path resolution            |

### EvalConfig

| Property     | Type       | Default  | Description                     |
| ------------ | ---------- | -------- | ------------------------------- |
| `include`    | `string[]` | -        | Glob patterns for eval files    |
| `exclude`    | `string[]` | -        | Glob patterns to exclude        |
| `setupFiles` | `string[]` | -        | Setup files to run before evals |
| `timeout`    | `number`   | `100000` | Default timeout in ms           |

### ProviderConfig

```ts
interface VitevalProviderConfig {
  openai:
    | {
        apiKey: string;
        project?: string;
        organization?: string;
      }
    | {
        client: OpenAI; // Pass existing client
      };
}
```

### Reporter Options

| Reporter  | Description                                 |
| --------- | ------------------------------------------- |
| `default` | Console output (Vitest default)             |
| `json`    | JSON to stdout                              |
| `file`    | JSON to `.viteval/results/<timestamp>.json` |

### Basic Configuration

```ts
// viteval.config.ts
import { defineConfig } from 'viteval/config';

export default defineConfig({
  reporters: ['default'],
  eval: {
    include: ['src/**/*.eval.ts'],
  },
});
```

### Full Configuration

```ts
// viteval.config.ts
import { defineConfig } from 'viteval/config';

export default defineConfig({
  // LLM provider for scorers that need it
  provider: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID,
    },
  },

  // Output reporters
  reporters: ['default', 'file'],

  // Evaluation settings
  eval: {
    include: ['src/**/*.eval.ts', 'tests/**/*.eval.ts'],
    exclude: ['**/*.skip.eval.ts'],
    setupFiles: ['./viteval.setup.ts'],
    timeout: 60000,
  },

  // Vite server settings
  server: {
    sourcemap: true,
    deps: {
      inline: ['some-esm-package'],
    },
  },

  // Dependency optimization
  deps: {
    interopDefault: true,
    optimizer: {
      include: ['lodash'],
    },
  },

  // Path aliases
  resolve: {
    alias: {
      '@': './src',
    },
  },

  // Vite plugins
  plugins: [],
});
```

### Setup Files

Setup files run before any evaluations. Use them for environment configuration.

```ts
// viteval.setup.ts
import { config } from 'dotenv';

// Load environment variables
config();

// Global setup
console.log('Viteval starting...');
```

### With Existing OpenAI Client

```ts
import { defineConfig } from 'viteval/config';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default defineConfig({
  provider: {
    openai: { client },
  },
  eval: {
    include: ['**/*.eval.ts'],
  },
});
```

---

## Types

### DataItem

```ts
interface DataItem<INPUT = unknown, OUTPUT = unknown, EXTRA = {}> {
  name?: string; // Optional test name
  input: INPUT; // Input to task
  expected: OUTPUT; // Expected output
  [key: string]: any; // Extra properties passed to task
}
```

### Score

```ts
interface Score {
  name: string; // Scorer name
  score: number | null; // Score value (0-1)
  metadata?: Record<string, unknown>; // Optional metadata
}
```

### EvalResult

```ts
interface EvalResult {
  name: string; // Test name
  sum: number; // Sum of scores
  mean: number; // Mean of scores
  median: number; // Median of scores
  threshold: number; // Pass threshold
  aggregation: 'mean' | 'median' | 'sum';
  scores: Score[]; // Individual scores
  input?: unknown; // Task input
  expected?: unknown; // Expected output
  output?: unknown; // Actual output
  metadata?: Record<string, unknown>;
}
```

---

## References

- [Scorers API](./scorers.md) - Scoring functions
- [Datasets API](./datasets.md) - Dataset definition
- [CLI Commands](../cli/commands.md) - Running evaluations
- [Vitest Config](https://vitest.dev/config/) - Underlying configuration
