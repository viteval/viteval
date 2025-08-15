# `evaluate()`

The `evaluate()` function is the core API for defining and running LLM evaluations using Vitest.

## Import

```ts
import { evaluate } from 'viteval';
```

## Signature

```ts
function evaluate<
  DATA_ITEM extends DataItem,
  DATA extends Data<DATA_ITEM>,
>(
  name: string,
  {
    data,
    aggregation = 'mean',
    task,
    scorers,
    threshold = 1.0,
    timeout = 10000,
  }: Eval<DATA>
)
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
interface Eval<DATA extends Data> {
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
  task: Task<InferDataInput<DATA>, InferDataOutput<DATA>, InferDataExtra<DATA>>;
  /**
   * The scorers to use for the evaluation.
   */
  scorers: Scorer<InferDataOutput<DATA>, InferDataExtra<DATA>>[];
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
  /**
   * The timeout for the evaluation.
   *
   * @default 10000
   */
  timeout?: number;
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
  { input: "What is 2+2?", expected: "4" },
  { input: "What is 3+3?", expected: "6" },
]

// From function
data: async () => {
  const response = await fetch('/api/test-cases');
  return response.json();
}

// From dataset
data: mathDataset
```

### `task`

Function that processes input and returns the model's output.

**Type**: `Task<InferDataInput<DATA>, InferDataOutput<DATA>, InferDataExtra<DATA>>`

```ts
type Task<INPUT, OUTPUT, EXTRA extends Extra> = (
  args: TaskArgs<INPUT, EXTRA>
) => Promise<OUTPUT> | OUTPUT;

type TaskArgs<INPUT, EXTRA extends Extra> = TF.Merge<
  EXTRA,
  {
    input: INPUT;
  }
>;
```

```ts
// Simple text generation
task: async ({ input }) => {
  const result = await generateText({
    model: 'gpt-4',
    prompt: input,
  });
  return result.text;
}

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
}

// Structured input
task: async ({ input, context }) => {
  return await answerQuestion(input.question, context);
}
```

### `scorers`

Array of scorer functions to evaluate the output quality.

**Type**: `Scorer<InferDataOutput<DATA>, InferDataExtra<DATA>>[]`

```ts
import { scorers, createScorer } from 'viteval';

// Built-in scorers
scorers: [scorers.exactMatch]
scorers: [scorers.levenshtein, scorers.factual]

// Custom scorer
const customScorer = createScorer({
  name: 'length-check',
  score: ({ output, expected }) => {
    return {
      score: output.length === expected?.length ? 1 : 0,
      metadata: { method: 'length_comparison' }
    };
  },
});

scorers: [customScorer, scorers.answerSimilarity]
```

### `threshold` (optional)

Minimum average score required for the evaluation to pass.

**Type**: `number`  
**Default**: `1.0`  
**Range**: `0.0` to `1.0`

```ts
// Require 90% average score
threshold: 0.9

// More lenient threshold
threshold: 0.6

// Perfect scores only (default)
threshold: 1.0
```

### `timeout` (optional)

Maximum time (in milliseconds) for each test case.

**Type**: `number`  
**Default**: `10000` (10 seconds)

```ts
// 1 minute timeout
timeout: 60000

// Quick timeout for fast models
timeout: 5000

// No timeout (not recommended)
timeout: 0
```

### `aggregation` (optional)

How to aggregate scores across multiple scorers.

**Type**: `ScorerAggregationType`  
**Default**: `'mean'`  
**Options**: `'mean' | 'median' | 'sum'`

```ts
// Use mean score (default)
aggregation: 'mean'

// Use median score
aggregation: 'median'

// Use sum of scores
aggregation: 'sum'
```

### `description` (optional)

Human-readable description of the evaluation.

**Type**: `string`

```ts
description: 'Evaluates math problem solving capabilities'
```

## DataItem Interface

The data should contain `DataItem` objects:

```ts
type DataItem<
  INPUT = unknown,
  OUTPUT = unknown,
  EXTRA extends Extra = Extra,
> = TF.Merge<
  EXTRA,
  {
    name?: string;
    input: INPUT;
    expected?: OUTPUT;
  }
>;
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

## Return Value

The `evaluate` function returns a Vitest test suite that can be run with the testing framework. The evaluation results are stored in the suite metadata.
