# Scorers API

Reference for built-in scorers and custom scorer creation.

## Overview

Scorers evaluate the quality of task outputs by comparing them against expected values. Viteval provides built-in scorers via [autoevals](https://github.com/braintrustdata/autoevals) and supports custom scorer creation.

## Import

```ts
import { scorers, createScorer } from 'viteval';
```

---

## createScorer

Create a custom scorer function.

### Signature

```ts
function createScorer<OUTPUT, EXTRA extends Extra = Extra>(
  config: ScorerConfig<OUTPUT, EXTRA>
): Scorer<OUTPUT, EXTRA>;
```

### ScorerConfig

| Property | Type                                | Description                |
| -------- | ----------------------------------- | -------------------------- |
| `name`   | `string`                            | Unique name for the scorer |
| `score`  | `(args: ScorerArgs) => ScoreResult` | Scoring function           |

### ScorerArgs

| Property   | Type     | Description                    |
| ---------- | -------- | ------------------------------ |
| `output`   | `OUTPUT` | Actual output from task        |
| `expected` | `OUTPUT` | Expected output from data      |
| `input`    | `INPUT`  | Original input                 |
| `...extra` | `EXTRA`  | Any extra properties from data |

### ScoreResult

| Property   | Type                      | Description         |
| ---------- | ------------------------- | ------------------- |
| `score`    | `number \| null`          | Score value (0-1)   |
| `metadata` | `Record<string, unknown>` | Optional debug info |

### Basic Custom Scorer

```ts
import { createScorer } from 'viteval';

const exactMatch = createScorer({
  name: 'exact-match',
  score: ({ output, expected }) => ({
    score: output === expected ? 1 : 0,
  }),
});
```

### Custom Scorer with Metadata

```ts
const lengthScorer = createScorer({
  name: 'length-check',
  score: ({ output, expected }) => {
    const diff = Math.abs(output.length - expected.length);
    const maxLen = Math.max(output.length, expected.length);
    const score = maxLen > 0 ? 1 - diff / maxLen : 1;

    return {
      score,
      metadata: {
        outputLength: output.length,
        expectedLength: expected.length,
        diff,
      },
    };
  },
});
```

### Async Scorer

```ts
const llmScorer = createScorer({
  name: 'llm-judge',
  score: async ({ output, expected, input }) => {
    const response = await llm.generate({
      system: 'Rate the answer quality from 0-1',
      user: `Question: ${input}\nExpected: ${expected}\nActual: ${output}`,
    });

    const score = parseFloat(response.text);
    return { score };
  },
});
```

### Typed Scorer

```ts
interface QAData {
  context: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const contextScorer = createScorer<string, QAData>({
  name: 'context-aware',
  score: ({ output, expected, context, difficulty }) => {
    // Access typed extra properties
    const weight = difficulty === 'hard' ? 0.8 : 1.0;
    const baseScore = output.includes(expected) ? 1 : 0;

    return {
      score: baseScore * weight,
      metadata: { context, difficulty },
    };
  },
});
```

---

## Built-in Scorers

Pre-built scorers from [autoevals](https://github.com/braintrustdata/autoevals). Access via `scorers.<name>`.

### String Matching

| Scorer        | Description                                    |
| ------------- | ---------------------------------------------- |
| `exactMatch`  | Exact string comparison (1 if match, 0 if not) |
| `levenshtein` | Normalized Levenshtein distance (0-1)          |

```ts
import { evaluate, scorers } from 'viteval';

evaluate('String Matching', {
  task: async ({ input }) => input.toLowerCase(),
  scorers: [scorers.exactMatch, scorers.levenshtein],
  data: [{ input: 'HELLO', expected: 'hello' }],
});
```

### LLM-Based Scorers

These scorers use an LLM to evaluate quality. Requires OpenAI provider configuration.

| Scorer              | Description                     |
| ------------------- | ------------------------------- |
| `factual`           | Factual accuracy check          |
| `answerCorrectness` | Overall answer correctness      |
| `answerRelevancy`   | Relevance to the question       |
| `answerSimilarity`  | Semantic similarity to expected |
| `possible`          | Whether answer is plausible     |
| `humor`             | Humor detection                 |
| `moderation`        | Content moderation check        |

```ts
evaluate('LLM Scoring', {
  task: async ({ input }) => await llm.generate(input),
  scorers: [
    scorers.factual,
    scorers.answerCorrectness,
    scorers.answerRelevancy,
  ],
  data: [{ input: 'What is the capital of France?', expected: 'Paris' }],
});
```

### RAG Scorers

For retrieval-augmented generation evaluation.

| Scorer                | Description                    |
| --------------------- | ------------------------------ |
| `contextPrecision`    | Precision of retrieved context |
| `contextRecall`       | Recall of retrieved context    |
| `contextRelevancy`    | Relevance of context to query  |
| `contextEntityRecall` | Entity recall in context       |

```ts
evaluate('RAG Evaluation', {
  task: async ({ input, context }) => {
    return await rag.query(input, context);
  },
  scorers: [
    scorers.contextPrecision,
    scorers.contextRecall,
    scorers.answerCorrectness,
  ],
  data: [
    {
      input: 'What is React?',
      expected: 'A JavaScript library for building UIs',
      context: ['React is a JS library', 'Created by Facebook'],
    },
  ],
});
```

### Specialized Scorers

| Scorer                | Description                     |
| --------------------- | ------------------------------- |
| `sql`                 | SQL query correctness           |
| `summary`             | Summary quality                 |
| `translation`         | Translation quality             |
| `embeddingSimilarity` | Cosine similarity of embeddings |
| `listContains`        | List containment check          |
| `numericDiff`         | Numeric difference              |
| `jsonDiff`            | JSON structure comparison       |

```ts
evaluate('SQL Evaluation', {
  task: async ({ input }) => generateSQL(input),
  scorers: [scorers.sql],
  data: [
    {
      input: 'Get all users',
      expected: 'SELECT * FROM users',
    },
  ],
});

evaluate('JSON Evaluation', {
  task: async ({ input }) => parseJSON(input),
  scorers: [scorers.jsonDiff],
  data: [
    {
      input: '{"name": "John"}',
      expected: { name: 'John' },
    },
  ],
});
```

---

## Complete Built-in Scorers Reference

| Scorer                | Category    | LLM Required | Description                 |
| --------------------- | ----------- | ------------ | --------------------------- |
| `exactMatch`          | String      | No           | Exact string match          |
| `levenshtein`         | String      | No           | Edit distance similarity    |
| `factual`             | LLM         | Yes          | Factual accuracy            |
| `answerCorrectness`   | LLM         | Yes          | Answer correctness          |
| `answerRelevancy`     | LLM         | Yes          | Answer relevance            |
| `answerSimilarity`    | LLM         | Yes          | Semantic similarity         |
| `contextPrecision`    | RAG         | Yes          | Context precision           |
| `contextRecall`       | RAG         | Yes          | Context recall              |
| `contextRelevancy`    | RAG         | Yes          | Context relevance           |
| `contextEntityRecall` | RAG         | Yes          | Entity recall in context    |
| `possible`            | LLM         | Yes          | Plausibility check          |
| `embeddingSimilarity` | Embedding   | Yes          | Embedding cosine similarity |
| `listContains`        | Data        | No           | List containment            |
| `numericDiff`         | Data        | No           | Numeric difference          |
| `jsonDiff`            | Data        | No           | JSON comparison             |
| `sql`                 | Specialized | Yes          | SQL correctness             |
| `summary`             | Specialized | Yes          | Summary quality             |
| `translation`         | Specialized | Yes          | Translation quality         |
| `moderation`          | Content     | Yes          | Content moderation          |
| `humor`               | Content     | Yes          | Humor detection             |

---

## Combining Scorers

Use multiple scorers for comprehensive evaluation.

```ts
evaluate('Multi-Scorer', {
  task: async ({ input }) => await llm.generate(input),
  scorers: [
    scorers.exactMatch, // Did it match exactly?
    scorers.levenshtein, // How close was it?
    scorers.factual, // Is it factually correct?
    scorers.answerRelevancy, // Is it relevant?
    createScorer({
      // Custom check
      name: 'no-profanity',
      score: ({ output }) => ({
        score: containsProfanity(output) ? 0 : 1,
      }),
    }),
  ],
  data: [{ input: 'What is 2+2?', expected: '4' }],
  aggregation: 'mean', // Average all scores
  threshold: 0.7, // Need 70% to pass
});
```

---

## Scorer Weights Pattern

Weight scorers by including them multiple times or using a weighted aggregation.

```ts
// Custom weighted scorer
const weightedScorer = createScorer({
  name: 'weighted-exact',
  score: ({ output, expected }) => {
    const weight = 2.0; // Double weight
    const match = output === expected ? 1 : 0;
    return { score: (match * weight) / weight }; // Normalize
  },
});
```

---

## References

- [Core API](./core.md) - Using scorers with `evaluate`
- [autoevals Documentation](https://github.com/braintrustdata/autoevals) - Built-in scorer source
- [OpenAI API](https://platform.openai.com/docs) - For LLM-based scorers
