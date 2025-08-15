# Migration Guide

This guide helps you migrate from other LLM evaluation frameworks to Viteval, and between different versions of Viteval.

## From Other Frameworks

### From LangSmith

If you're migrating from LangSmith, here's how to adapt your evaluations:

#### Dataset Migration

**LangSmith:**
```python
from langsmith import Client

client = Client()
dataset = client.create_dataset("my-dataset", description="Test dataset")

# Add examples
client.create_examples(
    inputs=[{"question": "What is 2+2?"}],
    outputs=[{"answer": "4"}],
    dataset_id=dataset.id
)
```

**Viteval:**
```ts
import { defineDataset } from 'viteval'

const dataset = defineDataset({
  name: 'my-dataset',
  data: async () => [
    { input: "What is 2+2?", expected: "4" }
  ]
})
```

#### Evaluation Migration

**LangSmith:**
```python
from langsmith.evaluation import evaluate

def my_task(inputs):
    return {"answer": my_model.generate(inputs["question"])}

def accuracy_evaluator(run, example):
    return {"key": "accuracy", "score": run.outputs["answer"] == example.outputs["answer"]}

evaluate(
    my_task,
    data="my-dataset",
    evaluators=[accuracy_evaluator]
)
```

**Viteval:**
```ts
import { evaluate, scorers } from 'viteval'

evaluate('My evaluation', {
  data: () => [{ input: "What is 2+2?", expected: "4" }],
  task: async (input) => myModel.generate(input),
  scorers: [scorers.exactMatch],
  threshold: 0.8
})
```

### From Braintrust

Migrating from Braintrust evaluations:

#### Experiment Migration

**Braintrust:**
```python
import braintrust

@braintrust.trace
def my_task(input):
    return my_model.generate(input)

braintrust.Eval(
    "My Eval",
    data=lambda: [{"input": "Question", "expected": "Answer"}],
    task=my_task,
    scores=[braintrust.Score(name="accuracy", scorer=accuracy_scorer)]
)
```

**Viteval:**
```ts
import { evaluate, createScorer } from 'viteval'

const accuracyScorer = createScorer({
  name: 'accuracy',
  score: ({ output, expected }) => output === expected ? 1 : 0
})

evaluate('My Eval', {
  data: () => [{ input: "Question", expected: "Answer" }],
  task: async (input) => myModel.generate(input),
  scorers: [accuracyScorer]
})
```

### From Phoenix/Arize

Migration from Phoenix evaluations:

#### Evaluation Setup

**Phoenix:**
```python
from phoenix.evals import (
    HallucinationEvaluator,
    RelevanceEvaluator,
    run_evals
)

hallucination_eval = HallucinationEvaluator()
relevance_eval = RelevanceEvaluator()

run_evals(
    dataframe=df,
    evaluators=[hallucination_eval, relevance_eval]
)
```

**Viteval:**
```ts
import { evaluate, scorers } from 'viteval'

evaluate('Phoenix migration', {
  data: () => yourDataArray,
  task: async (input) => myModel.generate(input),
  scorers: [
    scorers.factual, // Similar to hallucination detection
    scorers.answerRelevancy // Similar to relevance
  ]
})
```

## Viteval Version Migrations

### From v1.x to v2.x

#### Breaking Changes

1. **Configuration Format**

This section contains hypothetical migration examples for illustration. Viteval is currently in early development and major version changes have not occurred yet.

Viteval is currently in early development. When future versions are released, migration guides will be provided here.

## Common Migration Patterns

### Dataset Format Standardization

Most frameworks use different dataset formats. Here's how to standardize:

```ts
// Generic migration helper
function migrateDataset(oldFormat: any[], formatType: 'langsmith' | 'braintrust' | 'phoenix') {
  switch (formatType) {
    case 'langsmith':
      return oldFormat.map(item => ({
        input: item.inputs.question,
        expected: item.outputs.answer
      }))
    
    case 'braintrust':
      return oldFormat.map(item => ({
        input: item.input,
        expected: item.expected
      }))
    
    case 'phoenix':
      return oldFormat.map(item => ({
        input: item.query,
        expected: item.reference,
        context: item.context // Preserve additional context
      }))
  }
}

// Usage
const migratedData = migrateDataset(oldData, 'langsmith')
```

### Scorer Migration

Convert scoring functions from other frameworks:

```ts
// Helper for migrating scorer functions
function migrateScorer(oldScorer: any, framework: string) {
  return createScorer({
    name: oldScorer.name || 'migrated-scorer',
    score: ({ output, expected, input }) => {
      // Adapt the old scorer function
      switch (framework) {
        case 'langsmith':
          return oldScorer.evaluate({ 
            outputs: { answer: output }, 
            example: { outputs: { answer: expected } }
          })
        
        case 'braintrust':
          return oldScorer.scorer(output, expected)
        
        default:
          return oldScorer(output, expected)
      }
    }
  })
}
```

### Evaluation Configuration Migration

Standardize evaluation configurations:

```ts
// Migration helper for evaluation configs
interface LegacyEvalConfig {
  name: string
  dataset: any[]
  model: (input: string) => Promise<string>
  metrics: any[]
  threshold?: number
}

function migrateEvaluation(legacy: LegacyEvalConfig) {
  return evaluate(legacy.name, {
    data: () => legacy.dataset,
    task: legacy.model,
    scorers: legacy.metrics.map(metric => migrateScorer(metric, 'legacy')),
    threshold: legacy.threshold || 0.7
  })
}
```

## Post-Migration Checklist

After migrating to Viteval:

- [ ] Run all evaluations to ensure they work correctly
- [ ] Verify that scores are comparable to your previous framework
- [ ] Update CI/CD pipelines to use Viteval commands
- [ ] Train your team on the new Viteval workflow
- [ ] Update documentation to reflect new evaluation setup
- [ ] Consider new Viteval features like built-in scorers
- [ ] Set up proper error monitoring and logging
- [ ] Optimize parallel execution for your use case

## Getting Help

If you encounter issues during migration:

1. Check the [troubleshooting guide](../troubleshooting)
2. Review [examples](../examples/) for common patterns
3. Open an issue on [GitHub](https://github.com/zrosenbauer/viteval) with migration details
4. Join our community discussions for support

## Framework Comparison

| Feature | LangSmith | Braintrust | Phoenix | Viteval |
|---------|-----------|------------|---------|---------|
| Local Execution | ❌ | ✅ | ✅ | ✅ |
| TypeScript Support | ❌ | ⚠️ | ❌ | ✅ |
| Vitest Integration | ❌ | ❌ | ❌ | ✅ |
| Built-in Scorers | ✅ | ✅ | ✅ | ✅ |
| Custom Scorers | ✅ | ✅ | ✅ | ✅ |
| Parallel Execution | ✅ | ✅ | ✅ | ✅ |
| CI/CD Ready | ✅ | ✅ | ⚠️ | ✅ |