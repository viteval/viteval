# Getting Started

Welcome to Viteval! This guide will help you get up and running with the next generation LLM evaluation framework.

## What is Viteval?

Viteval is an LLM evaluation framework powered by Vitest that makes it easy to:

- Define and run evaluations with a familiar, Vitest-like API
- Create and manage datasets locally or remotely
- Use built-in scorers or create custom ones
- Integrate evaluations into your CI/CD pipeline

## Installation

Install Viteval using your preferred package manager:

::: code-group

```bash [npm]
npm install viteval
```

```bash [pnpm]
pnpm add viteval
```

```bash [yarn]
yarn add viteval
```

:::

## Your First Evaluation

Let's create a simple evaluation to test color detection. Create a file called `color.eval.ts`:

```ts
import { evaluate, scorers } from 'viteval';
import { generateText } from 'ai'; // or your preferred LLM library

evaluate('Color detection', {
  data: async () => [
    { input: "What color is the sky?", expected: "Blue" },
    { input: "What color is grass?", expected: "Green" },
    { input: "What color is snow?", expected: "White" },
  ],
  task: async (input) => {
    const result = await generateText({
      model: 'gpt-4', // Configure your model here
      prompt: input,
    });
    return result.text;
  },
  scorers: [scorers.levenshtein],
  threshold: 0.8,
});
```

## Running Your Evaluation

Run your evaluation using the Viteval CLI:

```bash
npx viteval
```

This will:
1. Discover all `*.eval.ts` files in your project
2. Execute each evaluation
3. Display results with scoring details
4. Exit with a non-zero code if any evaluation fails

## Understanding the Results

Viteval will output something like:

```
✓ Color detection (3/3 passed)
  ✓ What color is the sky? → Blue (score: 1.0)
  ✓ What color is grass? → Green (score: 1.0)  
  ✓ What color is snow? → White (score: 1.0)

Evaluations: 1 passed, 0 failed
```

## Next Steps

Now that you have your first evaluation running:

- [Learn about core concepts](/guide/concepts) like datasets, scorers, and tasks
- [Explore the CLI options](/guide/cli) for different use cases
- [Check out examples](/examples/) for more complex scenarios
- [Set up CI/CD integration](/guide/cicd) to run evaluations automatically

## Quick Tips

💡 **File naming**: Use `*.eval.ts` or `*.eval.js` for evaluation files  
💡 **Async support**: All functions support async/await  
💡 **Type safety**: Viteval is built with TypeScript for excellent type support  
💡 **Framework agnostic**: Works with any LLM library or framework