# Evaluation

Core concepts for running LLM evaluations with Viteval.

## Overview

An evaluation tests how well an LLM performs on a specific task. Viteval runs evaluations as Vitest test suites, giving you speed, parallelization, and familiar tooling.

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'primaryColor': '#313244',
    'primaryTextColor': '#cdd6f4',
    'primaryBorderColor': '#6c7086',
    'lineColor': '#89b4fa',
    'secondaryColor': '#45475a',
    'tertiaryColor': '#1e1e2e',
    'background': '#1e1e2e',
    'mainBkg': '#313244'
  },
  'flowchart': { 'curve': 'basis', 'padding': 15 }
}}%%
flowchart LR
    Dataset(["Dataset"]) --> Task(["Task"])
    Task --> Output(["Output"])
    Output --> Scorer(["Scorer"])
    Scorer --> Results[("Results")]

    classDef external fill:#313244,stroke:#f5c2e7,stroke-width:2px,color:#cdd6f4
    classDef core fill:#313244,stroke:#89b4fa,stroke-width:2px,color:#cdd6f4
    classDef scorer fill:#313244,stroke:#a6e3a1,stroke-width:2px,color:#cdd6f4
    classDef storage fill:#45475a,stroke:#a6e3a1,stroke-width:2px,color:#cdd6f4

    class Dataset external
    class Task,Output core
    class Scorer scorer
    class Results storage
```

## Components

| Component   | Description                                     |
| ----------- | ----------------------------------------------- |
| **Dataset** | Collection of test cases (input/expected pairs) |
| **Task**    | Function that calls your LLM                    |
| **Scorer**  | Function that evaluates task output             |
| **Results** | Aggregated scores and metrics                   |

## Basic Evaluation

```ts
import { evaluate } from 'viteval';

evaluate('my-eval', {
  data: [
    { input: 'Hello', expected: 'Hi there!' },
    { input: 'Goodbye', expected: 'See you later!' },
  ],
  task: async ({ input }) => {
    // Call your LLM here
    return llm.generate(input);
  },
  scorers: [exactMatch, semanticSimilarity],
});
```

## How It Works

1. **Load Data** - Dataset items are loaded
2. **Run Task** - Task function is called for each item
3. **Score Results** - Scorers evaluate each output
4. **Aggregate** - Results are combined into metrics
5. **Report** - Results displayed or saved

## Parallelization

Evaluations run in parallel by default. Control concurrency:

```ts
evaluate('my-eval', {
  data: myDataset,
  task: myTask,
  scorers: [myScorer],
  concurrency: 5, // Run 5 evaluations at once
});
```

## Configuration

Configure evaluations via `viteval.config.ts`:

```ts
import { defineConfig } from 'viteval';

export default defineConfig({
  timeout: 30000,
  reporters: ['default', 'json'],
});
```

## References

- [Scorers](./scorers.md) - How scorers work
- [Datasets](./datasets.md) - Dataset formats
- [Architecture](../architecture.md) - Package structure
