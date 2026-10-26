# `evaluate()`

`evaluate()` creates a Vitest suite with a test for each case. It runs your task,
scores the output, and checks the threshold.

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
- **Description**: The suite name shown in results

### `options`

- **Type**: `Eval<DATA, TASK_OUTPUT>`
- **Required**: Yes
- **Description**: Configuration object for the evaluation

## Eval interface

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

Provide cases as an array, a generator function, or a dataset.

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
  const response = await fetch('https://example.com/api/test-cases');
  if (!response.ok)
    throw new Error(`Dataset request failed: ${response.status}`);
  return response.json();
};

// From dataset
data: mathDataset;
```

### `task`

The function that receives a case's input and returns the output to score.
`TASK_OUTPUT` is inferred from the task's return value and can differ from the
dataset's expected type. Additional dataset fields are available alongside
`input`; `expected` is reserved for scorers.

**Type**: `Task<InferDataInput<DATA>, TASK_OUTPUT, InferDataExtra<DATA>>`

```ts
type Task<INPUT, OUTPUT, EXTRA extends Extra> = (
  args: TaskArgs<INPUT, EXTRA>
) => Promise<OUTPUT> | OUTPUT;

type TaskArgs<INPUT, EXTRA extends Extra> = EXTRA & { input: INPUT };
```

```ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

// Simple text generation
task: async ({ input }) => {
  const result = await generateText({
    model: openai('gpt-4.1-mini'),
    prompt: input,
  });
  return result.text;
};

// With chat messages
task: async ({ input }) => {
  const result = await generateText({
    model: openai('gpt-4.1-mini'),
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

Scorer functions to run against each task output.

**Type**: `Scorer<TASK_OUTPUT, InferDataOutput<DATA>, InferDataExtra<DATA>>[]`

```ts
import { scorers, createScorer } from 'viteval';

// Built-in scorers
scorers: [scorers.exactMatch()];
scorers: [scorers.levenshtein(), scorers.factual()];

// Custom scorer
const customScorer = createScorer<string>({
  name: 'length-check',
  score: ({ output, expected }) => {
    return {
      score: output.length === expected.length ? 1 : 0,
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

Native [Vitest test options](https://vitest.dev/api/test.html#test-options) applied
to every generated test case. Set timeouts, retries, repeats, concurrency, or
tags here.

**Type**: `TestOptions`

```ts
// Set a timeout and retry transient model failures.
testOptions: { timeout: 60_000, retry: 2 };

// Disable the timeout.
testOptions: { timeout: 0 };
```

### `aggregation` (optional)

How to combine a case's scorer results before checking its threshold.

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

An optional description of what the evaluation checks.

**Type**: `string`

```ts
description: 'Evaluates math problem solving capabilities';
```

## DataItem interface

Each case is a `DataItem`:

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

`Extra` holds additional case fields:

```ts
type Extra = Record<string, unknown>;
```

### Simple test cases

```ts
{ input: "Hello", expected: "Hi there!" }
```

### Complex input types

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

### Test case metadata

```ts
{
  input: "Translate: Hello",
  expected: "Hola",
  difficulty: "easy",
  language: "spanish"
}
```

### Named test cases

```ts
{
  name: "Basic addition",
  input: "What is 2+2?",
  expected: "4"
}
```
