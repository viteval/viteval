# defineDataset()

The `defineDataset()` function creates reusable datasets that can be shared across multiple evaluations.

## Signature

```ts
function defineDataset<T = string>(
  options: DatasetOptions<T>
): Dataset<T>
```

## Parameters

### `options`
- **Type**: `DatasetOptions<T>`
- **Required**: Yes
- **Description**: Configuration object for the dataset

## DatasetOptions

```ts
interface DatasetOptions<T = string> {
  name: string;
  data: () => Promise<TestCase<T>[]> | TestCase<T>[];
  cache?: boolean;
  version?: string;
  metadata?: Record<string, any>;
}
```

### `name`

Unique identifier for the dataset.

**Type**: `string`  
**Required**: Yes

```ts
defineDataset({
  name: 'math-problems',
  // ...
});
```

### `data`

Function that generates or loads the dataset.

**Type**: `() => Promise<TestCase<T>[]> | TestCase<T>[]`  
**Required**: Yes

```ts
// Static data
data: () => [
  { input: "2 + 2", expected: "4" },
  { input: "3 + 3", expected: "6" },
]

// Async data loading
data: async () => {
  const response = await fetch('/api/datasets/math');
  return response.json();
}

// Generated data
data: async () => {
  const problems = [];
  for (let i = 0; i < 1000; i++) {
    const a = Math.floor(Math.random() * 100);
    const b = Math.floor(Math.random() * 100);
    problems.push({
      input: `${a} + ${b}`,
      expected: String(a + b),
    });
  }
  return problems;
}
```

### `cache` (optional)

Whether to cache the dataset after first generation.

**Type**: `boolean`  
**Default**: `true`

```ts
// Cache the dataset (default)
cache: true

// Always regenerate
cache: false
```

### `version` (optional)

Version identifier for the dataset.

**Type**: `string`

```ts
version: '1.2.0'
```

### `metadata` (optional)

Additional information about the dataset.

**Type**: `Record<string, any>`

```ts
metadata: {
  description: 'Math problems for basic arithmetic',
  author: 'math-team@company.com',
  size: 1000,
  difficulty: 'easy',
}
```

## Return Value

Returns a `Dataset<T>` object:

```ts
interface Dataset<T> {
  name: string;
  data(): Promise<TestCase<T>[]>;
  metadata?: Record<string, any>;
  version?: string;
}
```

## Usage in Evaluations

```ts
import { defineDataset } from 'viteval/dataset';
import { evaluate, scorers } from 'viteval';

// Define the dataset
const mathDataset = defineDataset({
  name: 'basic-math',
  data: async () => [
    { input: "2 + 2", expected: "4" },
    { input: "5 - 3", expected: "2" },
    { input: "4 * 3", expected: "12" },
  ],
});

// Use in evaluation
evaluate('Math solver', {
  data: () => mathDataset.data(),
  task: async (input) => await solveMath(input),
  scorers: [scorers.exactMatch],
  threshold: 0.9,
});
```

## Examples

### Static Dataset

```ts
const greetingsDataset = defineDataset({
  name: 'greetings',
  data: () => [
    { input: "Hello", expected: "Hi there!" },
    { input: "Good morning", expected: "Good morning! How can I help?" },
    { input: "Goodbye", expected: "Goodbye! Have a great day!" },
  ],
  metadata: {
    language: 'english',
    type: 'conversational',
  },
});
```

### Generated Dataset

```ts
const randomQuestionsDataset = defineDataset({
  name: 'random-questions',
  data: async () => {
    const questions = [];
    const topics = ['science', 'history', 'math', 'literature'];
    
    for (let i = 0; i < 500; i++) {
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const question = await generateQuestion(topic);
      const answer = await generateAnswer(question);
      
      questions.push({
        input: question,
        expected: answer,
        metadata: { topic, generated: true },
      });
    }
    
    return questions;
  },
  cache: true, // Cache since generation is expensive
  version: '2.1.0',
});
```

### API-Based Dataset

```ts
const customerQuestionsDataset = defineDataset({
  name: 'customer-questions',
  data: async () => {
    const response = await fetch('https://api.company.com/support/questions', {
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN}`,
      },
    });
    
    const data = await response.json();
    
    return data.questions.map(q => ({
      input: q.question,
      expected: q.approved_answer,
      metadata: {
        category: q.category,
        difficulty: q.difficulty,
        timestamp: q.created_at,
      },
    }));
  },
  cache: false, // Don't cache as data changes frequently
});
```

### Complex Input Dataset

```ts
interface ChatContext {
  messages: Array<{ role: string; content: string }>;
  expectedResponse: string;
}

const chatDataset = defineDataset<ChatContext>({
  name: 'chat-conversations',
  data: async () => [
    {
      input: {
        messages: [
          { role: 'user', content: 'What is the weather like?' },
          { role: 'assistant', content: 'I need your location to check the weather.' },
          { role: 'user', content: 'San Francisco' },
        ],
        expectedResponse: 'Currently in San Francisco it is sunny and 72°F.',
      },
      expected: 'Currently in San Francisco it is sunny and 72°F.',
    },
  ],
});
```

## Dataset Management

### CLI Integration

Generate datasets using the CLI:

```bash
# Generate all datasets
viteval data

# Generate specific dataset
viteval data --name "math-problems"

# Force regeneration (ignore cache)
viteval data --force --name "customer-questions"

# List all datasets
viteval data --list
```

### Programmatic Access

```ts
// Access dataset info
console.log(mathDataset.name);      // "basic-math"
console.log(mathDataset.metadata);  // { description: "...", ... }

// Get data
const testCases = await mathDataset.data();
console.log(testCases.length);      // Number of test cases
```

## Best Practices

### Naming Convention

```ts
// Good: descriptive, kebab-case
defineDataset({ name: 'customer-support-questions' });
defineDataset({ name: 'code-generation-tasks' });

// Avoid: generic or unclear names
defineDataset({ name: 'data' });
defineDataset({ name: 'test' });
```

### Caching Strategy

```ts
// Cache expensive operations
defineDataset({
  name: 'llm-generated-data',
  data: async () => await generateWithLLM(), // Expensive
  cache: true,
});

// Don't cache frequently changing data
defineDataset({
  name: 'live-user-queries',
  data: async () => await fetchLatestQueries(), // Changes often
  cache: false,
});
```

### Versioning

```ts
// Version datasets when structure changes
defineDataset({
  name: 'product-descriptions',
  version: '2.0.0', // Updated to include new fields
  data: async () => loadProductData(),
});
```

### Error Handling

```ts
defineDataset({
  name: 'external-data',
  data: async () => {
    try {
      return await fetchExternalData();
    } catch (error) {
      console.warn('Failed to fetch external data, using fallback');
      return await loadFallbackData();
    }
  },
});
```

## Common Patterns

### Combining Datasets

```ts
const combinedDataset = defineDataset({
  name: 'all-questions',
  data: async () => {
    const [math, science, history] = await Promise.all([
      mathDataset.data(),
      scienceDataset.data(),
      historyDataset.data(),
    ]);
    
    return [...math, ...science, ...history];
  },
});
```

### Filtered Datasets

```ts
const easyMathDataset = defineDataset({
  name: 'easy-math',
  data: async () => {
    const allMath = await mathDataset.data();
    return allMath.filter(item => 
      item.metadata?.difficulty === 'easy'
    );
  },
});
```

### Parameterized Datasets

```ts
function createMathDataset(operation: string, count: number) {
  return defineDataset({
    name: `math-${operation}`,
    data: async () => generateMathProblems(operation, count),
    metadata: { operation, count },
  });
}

const additionDataset = createMathDataset('addition', 100);
const multiplicationDataset = createMathDataset('multiplication', 50);
```