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

## Initialize a Viteval Project

```bash
npx viteval init
```

This will create a `viteval.config.ts` && `viteval.setup.ts` (so you can configure your environment variables) file in your project root.

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

### Running Your Evaluation

Run your evaluation using the Viteval CLI:

```bash
npx viteval
```

This will:
1. Discover all `*.eval.ts` files in your project
2. Execute each evaluation
3. Display results with scoring details
4. Exit with a non-zero code if any evaluation fails

### Understanding the Results

Viteval will output something like:

```
✓ Color detection (3/3 passed)
  ✓ What color is the sky? → Blue (score: 1.0)
  ✓ What color is grass? → Green (score: 1.0)  
  ✓ What color is snow? → White (score: 1.0)

Evaluations: 1 passed, 0 failed
```

## Your First Dataset

Now that you've run your first evaluation, let's create a dataset, that you can use in the evaluation.

```ts
import { defineDataset } from 'viteval/dataset';

export default defineDataset({
  name: 'color-dataset',
  data: async () => [
    { input: "What color is the sky?", expected: "Blue" },
    { input: "What color is grass?", expected: "Green" },
    { input: "What color is snow?", expected: "White" },
  ],
});
```

### Adding the Dataset to the Evaluation

You can then use the dataset in the evaluation by importing it and passing it to the `data` option.

```ts
import dataset from './color.dataset';

evaluate('Color detection', {
  data: dataset,
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

### Running the Evaluation with the Dataset

Now you can run the evaluation again, and it will use the dataset.

```bash
npx viteval
```

If you configured the dataset to be stored locally, it will be stored in the `./viteval/datasets` directory relative to the config file.

## Next Steps

Now that you have your first evaluation running:

- [Learn about core concepts](/guide/concepts) like datasets, scorers, and tasks
- [Explore the CLI options](/guide/cli) for different use cases
- [Check out examples](/examples/) for more complex scenarios
- [Set up CI/CD integration](/guide/cicd) to run evaluations automatically
