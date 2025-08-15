# evaluate()

The `evaluate()` function is the core API for defining and running LLM evaluations.

## Signature

```ts
function evaluate<T = string>(
  name: string,
  options: EvaluationOptions<T>
): Evaluation<T>
```

## Parameters

### `name`
- **Type**: `string`
- **Required**: Yes
- **Description**: A human-readable name for the evaluation

### `options`
- **Type**: `EvaluationOptions<T>`
- **Required**: Yes
- **Description**: Configuration object for the evaluation

## EvaluationOptions

```ts
interface EvaluationOptions<T = string> {
  data: () => Promise<TestCase<T>[]> | TestCase<T>[];
  task: (input: T) => Promise<string> | string;
  scorers: Scorer[];
  threshold?: number;
  timeout?: number;
  metadata?: Record<string, any>;
}
```

### `data`

Function that returns test cases for the evaluation.

**Type**: `() => Promise<TestCase<T>[]> | TestCase<T>[]`

```ts
// Inline data
data: async () => [
  { input: "What is 2+2?", expected: "4" },
  { input: "What is 3+3?", expected: "6" },
]

// From external source
data: async () => {
  const response = await fetch('/api/test-cases');
  return response.json();
}

// Generated data
data: async () => {
  return Array.from({ length: 100 }, (_, i) => ({
    input: `What is ${i} + 1?`,
    expected: String(i + 1),
  }));
}
```

### `task`

Function that processes input and returns the model's output.

**Type**: `(input: T) => Promise<string> | string`

```ts
// Simple text generation
task: async (input) => {
  const result = await generateText({
    model: 'gpt-4',
    prompt: input,
  });
  return result.text;
}

// With chat messages
task: async (input) => {
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
task: async ({ question, context }) => {
  return await answerQuestion(question, context);
}
```

### `scorers`

Array of scorer functions to evaluate the output quality.

**Type**: `Scorer[]`

```ts
import { scorers, createScorer } from 'viteval';

// Built-in scorers
scorers: [scorers.exactMatch]
scorers: [scorers.levenshtein, scorers.factual]

// Custom scorer
const customScorer = createScorer({
  name: 'length-check',
  score: ({ output, expected }) => {
    return output.length === expected.length ? 1 : 0;
  },
});

scorers: [customScorer, scorers.answerSimilarity]
```

### `threshold` (optional)

Minimum average score required for the evaluation to pass.

**Type**: `number`  
**Default**: `0.8`  
**Range**: `0.0` to `1.0`

```ts
// Require 90% average score
threshold: 0.9

// More lenient threshold
threshold: 0.6

// Perfect scores only
threshold: 1.0
```

### `timeout` (optional)

Maximum time (in milliseconds) for each test case.

**Type**: `number`  
**Default**: `30000` (30 seconds)

```ts
// 1 minute timeout
timeout: 60000

// Quick timeout for fast models
timeout: 5000

// No timeout (not recommended)
timeout: 0
```

### `metadata` (optional)

Additional metadata for the evaluation.

**Type**: `Record<string, any>`

```ts
metadata: {
  model: 'gpt-4',
  version: '1.2.0',
  tags: ['chat', 'customer-support'],
  author: 'team@company.com',
}
```

## TestCase

```ts
interface TestCase<T = string> {
  input: T;
  expected: string;
  metadata?: Record<string, any>;
}
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
  metadata: {
    language: "spanish",
    difficulty: "easy",
  }
}
```

## Return Value

Returns an `Evaluation<T>` object that can be used for introspection:

```ts
const eval = evaluate('My test', { /* options */ });

console.log(eval.name);      // "My test"
console.log(eval.options);   // EvaluationOptions
```

## Examples

### Basic Text Evaluation

```ts
import { evaluate, scorers } from 'viteval';

evaluate('Color questions', {
  data: async () => [
    { input: "What color is the sky?", expected: "Blue" },
    { input: "What color is grass?", expected: "Green" },
  ],
  task: async (input) => {
    return await callLLM(input);
  },
  scorers: [scorers.levenshtein],
  threshold: 0.8,
});
```

### Structured Input Evaluation

```ts
interface QuestionContext {
  question: string;
  context: string;
}

evaluate<QuestionContext>('QA with context', {
  data: async () => [
    {
      input: {
        question: "What is the capital?",
        context: "France is a country in Europe. Paris is its capital."
      },
      expected: "Paris"
    }
  ],
  task: async ({ question, context }) => {
    return await answerWithContext(question, context);
  },
  scorers: [scorers.factual, scorers.answerRelevancy],
  threshold: 0.85,
});
```

### Multiple Scorers with Custom Logic

```ts
const lengthPenalty = createScorer({
  name: 'length-penalty',
  score: ({ output, expected }) => {
    const ratio = output.length / expected.length;
    return ratio > 2 ? 0.5 : 1.0; // Penalize overly long responses
  },
});

evaluate('Concise answers', {
  data: async () => loadTestCases(),
  task: async (input) => await generateAnswer(input),
  scorers: [
    scorers.factual,      // Must be factually correct
    scorers.answerSimilarity, // Must be semantically similar  
    lengthPenalty,        // Must not be too verbose
  ],
  threshold: 0.75, // Average across all three scorers
});
```

## Best Practices

- **Descriptive names**: Use clear, specific names for evaluations
- **Meaningful test data**: Include realistic, diverse test cases
- **Appropriate scorers**: Choose scorers that match your use case
- **Reasonable thresholds**: Start low and increase as you improve
- **Error handling**: Ensure your task function handles edge cases gracefully

## Common Patterns

### Conditional Evaluation

```ts
const isProduction = process.env.NODE_ENV === 'production';

evaluate('Production safety check', {
  data: async () => isProduction ? await loadProductionData() : [],
  task: async (input) => await processInput(input),
  scorers: [scorers.moderation, scorers.factual],
  threshold: 0.95,
});
```

### Parameterized Evaluations

```ts
function createMathEvaluation(operation: string, generator: Function) {
  return evaluate(`Math: ${operation}`, {
    data: async () => generator(100), // Generate 100 test cases
    task: async (input) => await solveMathProblem(input),
    scorers: [scorers.exactMatch],
    threshold: 0.9,
  });
}

createMathEvaluation('addition', generateAdditionProblems);
createMathEvaluation('multiplication', generateMultiplicationProblems);
```