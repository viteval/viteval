# `evaluate()`

The `evaluate()` function is the core API for defining and running LLM evaluations using Vitest.

## Import

```ts
import { evaluate } from 'viteval';
```

## Signature

```ts
function evaluate<DATA extends Data, TASK_OUTPUT = InferDataOutput<DATA>>(
  name: string,
  {
    data,
    aggregation = 'mean',
    task,
    scorers,
    threshold = 1.0,
    testOptions,
  }: Eval<DATA, TASK_OUTPUT>
);
```

## Parameters

### `name`

- **Type**: `string`
- **Required**: Yes
- **Description**: A human-readable name for the evaluation

### `options`

- **Type**: `Eval<DATA>`
- **Required**: Yes
- **Description**: Configuration object for the evaluation

## Eval Interface

```ts
interface Eval<DATA extends Data, TASK_OUTPUT = InferDataOutput<DATA>> {
  /**
   * The description of the evaluation.
   */
  description?: string;
  /**
   * The data to use for the evaluation.
   */
  data: DATA;
  /**
   * The task to evaluate.
   */
  task: Task<InferDataInput<DATA>, TASK_OUTPUT, InferDataExtra<DATA>>;
  /**
   * The scorers to use for the evaluation.
   */
  scorers: Scorer<TASK_OUTPUT, InferDataOutput<DATA>, InferDataExtra<DATA>>[];
  /**
   * The aggregation type for the evaluation.
   *
   * @default 'mean'
   */
  aggregation?: ScorerAggregationType;
  /**
   * The threshold for the evaluation.
   *
   * @default 1.0
   */
  threshold?: number;
  /** Native Vitest options applied to every generated test case. */
  testOptions?: TestOptions;
}
```

### `data`

The data to use for the evaluation. Can be an array, function, or dataset.

**Type**: `Data<DATA_ITEM>`

```ts
type Data<DATA_ITEM extends DataItem> =
  | DATA_ITEM[]
  | DataGenerator<DATA_ITEM>
  | Dataset<DataGenerator<DATA_ITEM>>;
```

```ts
// Inline data
data: [
  { input: 'What is 2+2?', expected: '4' },
  { input: 'What is 3+3?', expected: '6' },
];

// From function
data: async () => {
  const response = await fetch('/api/test-cases');
  return response.json();
};

// From dataset
data: mathDataset;
```

### `task`

Function that processes input and returns the model's output.

**Type**: `Task<InferDataInput<DATA>, InferDataOutput<DATA>, InferDataExtra<DATA>>`

```ts
type Task<INPUT, OUTPUT, EXTRA extends Extra> = (
  args: TaskArgs<INPUT, EXTRA>
) => Promise<OUTPUT> | OUTPUT;

type TaskArgs<INPUT, EXTRA extends Extra> = EXTRA & { input: INPUT };
```

```ts
// Simple text generation
task: async ({ input }) => {
  const result = await generateText({
    model: 'gpt-4',
    prompt: input,
  });
  return result.text;
};

// With chat messages
task: async ({ input }) => {
  const result = await generateText({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a math tutor.' },
      { role: 'user', content: input },
    ],
  });
  return result.text;
};

// Structured input
task: async ({ input, context }) => {
  return await answerQuestion(input.question, context);
};
```

### `scorers`

Array of scorer functions to evaluate the output quality.

**Type**: `Scorer<InferDataOutput<DATA>, InferDataExtra<DATA>>[]`

```ts
import { scorers, createScorer } from 'viteval';

// Built-in scorers
scorers: [scorers.exactMatch()];
scorers: [scorers.levenshtein(), scorers.factual()];

// Custom scorer
const customScorer = createScorer({
  name: 'length-check',
  score: ({ output, expected }) => {
    return {
      score: output.length === expected?.length ? 1 : 0,
      metadata: { method: 'length_comparison' },
    };
  },
});

scorers: [customScorer, scorers.answerSimilarity()];
```

### `threshold` (optional)

Minimum score for each case's configured mean, median, or sum aggregation.

**Type**: `number`  
**Default**: `1.0`  
**Range**: Any finite number. Sum thresholds may exceed `1.0`.

```ts
// Require 90% average score
threshold: 0.9;

// More lenient threshold
threshold: 0.6;

// Perfect scores only (default)
threshold: 1.0;
```

### `testOptions` (optional)

Native [Vitest test options](https://vitest.dev/api/test.html#test-options) applied to every generated test case. Configure timeout, retry, repeats, concurrency, tags, and other test behavior here instead of through a Viteval-specific wrapper.

**Type**: `TestOptions`

```ts
// 1 minute timeout
testOptions: {
  timeout: 60_000;
}

// Retry transient model failures through Vitest
testOptions: {
  retry: 2;
}

// Disable timeout
testOptions: {
  timeout: 0;
}
```

### `aggregation` (optional)

How to aggregate scores across multiple scorers.

**Type**: `ScorerAggregationType`  
**Default**: `'mean'`  
**Options**: `'mean' | 'median' | 'sum'`

```ts
// Use mean score (default)
aggregation: 'mean';

// Use median score
aggregation: 'median';

// Use sum of scores
aggregation: 'sum';
```

### `description` (optional)

Human-readable description of the evaluation.

**Type**: `string`

```ts
description: 'Evaluates math problem solving capabilities';
```

## DataItem Interface

The data should contain `DataItem` objects:

```ts
type DataItem<
  INPUT = unknown,
  OUTPUT = unknown,
  EXTRA extends Extra = Extra,
> = EXTRA & {
  name?: string;
  input: INPUT;
  expected: OUTPUT;
};
```

Where `Extra` is:

```ts
type Extra = Record<string, unknown>;
```

### Simple Test Cases

```ts
{ input: "Hello", expected: "Hi there!" }
```

### Complex Input Types

```ts
// Object input
{
  input: {
    question: "What's the weather?",
    location: "San Francisco"
  },
  expected: "Sunny, 72°F"
}

// Array input
{
  input: ["apple", "banana", "cherry"],
  expected: "apple, banana, cherry"
}
```

### Test Case Metadata

```ts
{
  input: "Translate: Hello",
  expected: "Hola",
  difficulty: "easy",
  language: "spanish"
}
```

### Named Test Cases

```ts
{
  name: "Basic addition",
  input: "What is 2+2?",
  expected: "4"
}
```
