# Examples

This section provides practical examples of using Viteval for different scenarios.

## Quick Examples

### Basic Text Evaluation

```ts
import { evaluate, scorers } from 'viteval';

evaluate('Simple QA', {
  data: async () => [
    { input: "What is the capital of France?", expected: "Paris" },
    { input: "What is 2+2?", expected: "4" },
  ],
  task: async (input) => {
    return await callYourLLM(input);
  },
  scorers: [scorers.levenshtein],
  threshold: 0.8,
});
```

### Custom Dataset

```ts
import { defineDataset } from 'viteval/dataset';

const mathDataset = defineDataset({
  name: 'basic-math',
  data: async () => {
    const problems = [];
    for (let i = 0; i < 100; i++) {
      const a = Math.floor(Math.random() * 10);
      const b = Math.floor(Math.random() * 10);
      problems.push({
        input: `What is ${a} + ${b}?`,
        expected: String(a + b),
      });
    }
    return problems;
  },
});

evaluate('Math solver', {
  data: () => mathDataset.data(),
  task: async (input) => await solveMath(input),
  scorers: [scorers.exactMatch],
  threshold: 0.9,
});
```

### Multiple Scorers

```ts
evaluate('Content quality', {
  data: async () => loadQuestions(),
  task: async (input) => await generateContent(input),
  scorers: [
    scorers.factual,        // Must be factually correct
    scorers.answerSimilarity, // Must be semantically similar
    scorers.moderation,     // Must be safe content
  ],
  threshold: 0.8,
});
```

## Browse Examples

<div class="examples-grid">

[**Basic Evaluation**](/examples/basic)  
Simple text-based evaluations with different scorers

[**Custom Datasets**](/examples/datasets)  
Creating reusable datasets for your evaluations

[**Custom Scorers**](/examples/scorers)  
Building custom scoring functions for specific needs

[**Advanced Patterns**](/examples/advanced)  
Complex evaluation scenarios and best practices

</div>

## Common Use Cases

### Chat/Conversational AI

```ts
evaluate('Customer support chat', {
  data: async () => [
    {
      input: "I need help with my order",
      expected: "I'd be happy to help you with your order. Can you provide your order number?",
    },
  ],
  task: async (input) => await chatBot.respond(input),
  scorers: [scorers.answerRelevancy, scorers.moderation],
  threshold: 0.85,
});
```

### Code Generation

```ts
evaluate('Python code generation', {
  data: async () => [
    {
      input: "Write a function to calculate factorial",
      expected: "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n-1)",
    },
  ],
  task: async (input) => await generateCode(input, 'python'),
  scorers: [scorers.exactMatch, syntaxChecker],
  threshold: 0.9,
});
```

### Content Summarization

```ts
evaluate('Article summarization', {
  data: async () => loadArticlesAndSummaries(),
  task: async (article) => await summarize(article),
  scorers: [scorers.summary, scorers.answerSimilarity],
  threshold: 0.75,
});
```

## Running Examples

To run these examples:

1. **Clone the examples**: Each example is available in the `/examples` directory
2. **Install dependencies**: `npm install` in the example directory  
3. **Configure your API keys**: Set up `.env` with your LLM provider keys
4. **Run evaluations**: `npx viteval` in the example directory

<style>
.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.examples-grid a {
  display: block;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-decoration: none;
  transition: border-color 0.3s;
}

.examples-grid a:hover {
  border-color: var(--vp-c-brand);
}
</style>