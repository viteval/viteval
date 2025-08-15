# Examples

This section provides practical examples of using Viteval for different scenarios.

## Basic Text Evaluation

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

## Custom Dataset

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

## Multiple Scorers

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

## Runnable Examples

There are a number of examples available in the [Viteval GitHub repository](https://github.com/viteval/viteval/tree/main/examples).

<div class="examples-grid">

[**Simple Evaluation**](https://github.com/viteval/viteval/tree/main/examples/basic)
Simple text-based evaluation

[**Complex Evaluation**](https://github.com/viteval/viteval/tree/main/examples/complex)
Complex & real-world evaluation
</div>

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