<p align="center">
<a href="https://viteval.dev">
<img src="./.github/assets/viteval-icon.png" height="200">
</a>
</p>

<h1 align="center">
Viteval
</h1>
<p align="center">
Next generation LLM evaluation framework powered by Vitest.
<p>
<p align="center">
  <a href="https://www.npmjs.com/package/viteval"><img src="https://img.shields.io/npm/v/viteval?color=BE54F5&label="></a>
<p>

<p align="center">
 <a href="https://viteval.dev">Documentation</a> | <a href="https://viteval.dev/guide/">Getting Started</a> | <a href="https://viteval.dev/examples">Examples</a>
</p>
<br>
<br>

## Features

- ✅ Vitest-like API: easily define and run evals the same way you run tests.
- ✅ Local Dataset: quickly define and generate datasets that are stored locally or in a database.
- ✅ Scorer framework: easily define and use scorers to evaluate your LLM.
- ✅ CI ready: easily integrate with your CI pipeline and run evals the same way you run tests.
- (SOON) Reporters: custom reporters to help you visualize your evals, or upload them to a vendor 
- (SOON) Remote Dataset: easily define & use datasets that are stored in a database, S3 bucket, or a vendor

## Installation

```bash
npm install viteval
```

## Usage

You can use `viteval` to evaluate your LLM and add tests in your CI in one single file.

```ts
import { evaluate, scorers } from 'viteval';
import { generateText } from 'ai';

evaluate('Color detection', {
  data: async () => [
    { input: "What color is the sky?", expected: "Blue" },
    { input: "What color is grass?", expected: "Green" },
  ],
  task: async (input) => {
    const result = await generateText(input);
    return result.text;
  },
  scorers: [scorers.levenshtein],
  threshold: 0.8,
});
```

Now you can run the eval by running:

```bash
viteval
```

## API

### Evaluations

You can define evaluations in your codebase and run them with the `viteval` command.

```ts
import { evaluate, scorers } from 'viteval';
import { generateText } from 'ai';

evaluate('Color detection', {
  data: async () => [
    { input: "What color is the sky?", expected: "Blue" },
    { input: "What color is grass?", expected: "Green" },
  ],
  task: async (input) => {
    const result = await generateText(input);
    return result.text;
  },
  scorers: [scorers.levenshtein],
  threshold: 0.8,
});
```

### Datasets

You can define datasets in your codebase and run them with the `viteval data` command or by running the `viteval` command (they automatically run every time you run the `viteval` command).

```ts
import { defineDataset } from 'viteval/dataset';

const dataset = defineDataset({
  name: 'color-questions',
  data: async () => {
    const results = [];
    for (let i = 0; i < 100; i++) {
      const { object: result} = await generateObject('Create a question and answer for the color of objects, such as "What is the color of the sky?" => "The sky is blue."', {
        model: openai('gpt-4o'),
        schema: z.object({
          question: z.string(),
          answer: z.string(),
        }),
      });

      results.push({
        input: result.question,
        expected: result.answer,
      });
    }
    return results;
  },
});
```

### Scoring

You can use existing scorers

```ts
import { evaluate, scorers } from 'viteval';

evaluate('My evaluation', {
  // ... other config
  scorers: [scorers.factual, scorers.levenshtein],
  threshold: 0.8,
});
```

or create your own

```ts
import { createScorer } from 'viteval';

const myCustomScorer = createScorer({
  name: 'my-custom-scorer',
  score: (args) => {
    return args.output.length - args.expected.length;
  },
});
```

#### Available scorers

Viteval provides a comprehensive set of prebuilt scorers for evaluating LLM outputs:

| Scorer | Description |
|--------|-------------|
| `factual` | Evaluates the factual accuracy of responses against ground truth |
| `levenshtein` | Measures text similarity using Levenshtein distance algorithm |
| `exactMatch` | Checks if output exactly matches expected text |
| `moderation` | Detects harmful, inappropriate, or unsafe content |
| `sql` | Validates SQL query syntax and correctness |
| `summary` | Evaluates summary quality and completeness |
| `translation` | Assesses translation accuracy between languages |
| `answerCorrectness` | Measures how correct an answer is compared to expected |
| `answerRelevancy` | Evaluates how relevant the answer is to the question |
| `answerSimilarity` | Measures semantic similarity between output and expected |
| `contextEntityRecall` | Checks if all expected entities are mentioned in context |
| `contextPrecision` | Measures precision of context usage in responses |
| `contextRecall` | Evaluates how well context information is recalled |
| `contextRelevancy` | Assesses relevance of provided context to the task |
| `possible` | Checks if an answer is logically possible |
| `embeddingSimilarity` | Measures semantic similarity using embeddings |
| `listContains` | Verifies if a list contains expected items |
| `numericDiff` | Calculates numerical difference between outputs |
| `jsonDiff` | Compares JSON structures for differences |
| `humor` | Evaluates humor quality and appropriateness |


