# Best Practices

This guide covers recommended practices for using Viteval effectively in your projects.

## Evaluation Organization

### Structure Your Evaluations

Organize your evaluations in a logical directory structure:

```
evals/
├── reasoning/
│   ├── math.eval.ts
│   └── logic.eval.ts
├── summarization/
│   └── summary.eval.ts
└── qa/
    └── factual.eval.ts
```

### Naming Conventions

- Use descriptive names for your evaluations
- Include the domain or capability being tested
- Use `.eval.ts` extension for evaluation files

```ts
// Good
evaluate('Mathematical reasoning - basic arithmetic', { ... })
evaluate('Summarization - news articles', { ... })

// Avoid
evaluate('test1', { ... })
evaluate('eval', { ... })
```

## Dataset Management

### Keep Datasets Small and Focused

- Start with small datasets (10-50 examples) for quick iteration
- Use larger datasets (100+ examples) for production evaluation
- Split complex evaluations into focused sub-evaluations

### Version Your Datasets

```ts
const dataset = defineDataset({
  name: 'qa-medical-v2', // Include version in name
  data: async () => {
    // Your dataset logic
  }
})
```

## Scoring Strategy

### Combine Multiple Scorers

Use multiple scorers to get a comprehensive view of performance:

```ts
evaluate('Content quality assessment', {
  data: () => [...],
  task: async ({ input }) => generateContent(input),
  scorers: [
    scorers.factual,
    scorers.answerRelevancy,
    scorers.moderation
  ],
  threshold: 0.7
})
```

### Custom Scorers for Domain-Specific Needs

Create custom scorers for specialized evaluation criteria:

```ts
const codeQualityScorer = createScorer({
  name: 'code-quality',
  score: async ({ output }) => {
    // Check for syntax errors, best practices, etc.
    const quality = await evaluateCodeQuality(output)
    return { score: quality }
  }
})
```

## Testing and Validation

### Validate Your Scorers

Test your custom scorers with known inputs:

```ts
// scorer.test.ts
import { test, expect } from 'vitest'
import { myCustomScorer } from './scorers'

test('custom scorer returns expected values', async () => {
  const result = await myCustomScorer({
    output: 'The sky is blue',
    expected: 'Blue sky',
    input: 'What color is the sky?'
  })
  
  expect(result.score).toBeGreaterThan(0.5)
})
```

### Regression Testing

Use fixed datasets to detect performance regressions:

```ts
evaluate('Regression test - factual QA', {
  data: () => FIXED_QA_DATASET, // Never changes
  task: async ({ input }) => myModel.generate(input),
  scorers: [scorers.factual],
  threshold: 0.85 // Maintain minimum performance
})
```

## Error Handling

Implement robust error handling in your tasks:

```ts
evaluate('Robust evaluation', {
  data: () => [...],
  task: async ({ input }) => {
    try {
      return await myModel.generate(input)
    } catch (error) {
      console.error('Generation failed:', error)
      return 'ERROR: Generation failed'
    }
  },
  scorers: [scorers.factual]
})
```