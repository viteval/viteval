# `scorers`

Viteval includes deterministic scorers, embedding similarity scorers, and LLM
judges. Call each factory to create a scorer. LLM and embedding scorers use the
models initialized in Vitest setup. See [Configuration](/api/configuration).

The scores in the examples illustrate how to read results. Model-based scores
vary with the configured model and are not guarantees of correctness or safety.

Judge scorers accept `{ model }` to override the initialized language model.
Model failures return `score: null` with an error in `metadata`; null scores
contribute 0 to evaluation aggregation.

## Import

```ts
import { scorers } from 'viteval';
```

## Text similarity

### `exactMatch`

Returns 1 if output exactly matches expected, 0 otherwise.

```ts
scorers.exactMatch();
```

**Use cases**: Exact answers, structured outputs, code generation

**Example**:

```ts
// Input: "What is 2+2?"
// Output: "4"
// Expected: "4"
// Score: 1.0

// Output: "Four"
// Expected: "4"
// Score: 0.0
```

### `levenshtein`

Scores text similarity using Levenshtein edit distance.

```ts
scorers.levenshtein();
```

**Range**: 0.0 - 1.0 (higher = more similar)  
**Use cases**: Approximate text matching, typo tolerance

**Example**:

```ts
// Output: "The sky is blue"
// Expected: "The sky is bleu"
// Score: ~0.87 (two edits across 15 characters)

// Output: "Blue sky"
// Expected: "The sky is blue"
// Score: ~0.27 (11 edits across 15 characters)
```

### `answerSimilarity`

Semantic similarity using embeddings.

```ts
scorers.answerSimilarity();
```

**Range**: 0.0 - 1.0  
**Use cases**: Meaning-based comparison, paraphrasing

**Example**:

```ts
// Output: "The capital of France is Paris"
// Expected: "Paris is France's capital city"
// Score: ~0.95 (same meaning, different wording)
```

### `embeddingSimilarity`

Measures semantic similarity using embeddings.

```ts
scorers.embeddingSimilarity();
```

**Range**: 0.0 - 1.0  
**Use cases**: Semantic search, content matching

**Model setup**:

- Uses the embedding model configured in worker setup
- Compares outputs and expected answers with cosine similarity
- Language support depends on the selected model

## Content quality

### `factual`

Asks an LLM judge to compare the output's factual accuracy with the expected answer.

```ts
scorers.factual();
```

**Range**: 0.0 - 1.0  
**Use cases**: Knowledge-based QA, educational content

The reported scorer name is `Factuality`. The judge returns one of five
categories: consistent subset (0.4), consistent superset (0.6), same details (1),
disagreement (0), or immaterial differences (1). This is not a continuous
confidence score.

**Example**:

```ts
// Question: "What is the capital of France?"
// Output: "Paris is the capital of France."
// Expected: "Paris is the capital of France."
// Score: 1.0 (factually correct)

// Output: "London is the capital of France"
// Expected: "Paris"
// Score: 0.0 (factually incorrect)
```

### `summary`

Asks an LLM judge to compare the submitted summary with an expert summary of
`input`. Returns 0 or 1.

```ts
scorers.summary();
```

**Range**: 0.0 - 1.0  
**Use cases**: Text summarization, content condensation

**Criteria**:

- Compares which summary better describes the original text
- Ignores style, grammar, and punctuation differences

### `translation`

Asks an LLM judge to assess a translation against the expected answer.

```ts
scorers.translation();
```

**Range**: 0.0 - 1.0  
**Use cases**: Machine translation, multilingual content

**Criteria**:

- Meaning preservation, including nouns and tenses
- Verbs or adjectives that change the meaning
- Ignores style and punctuation differences

Include a `language` field in each case to name the source language. The judge
compares translations into English and returns 0 or 1.

## Answer quality

### `answerCorrectness`

Asks an LLM judge to compare an answer with the expected answer.

```ts
scorers.answerCorrectness();
```

**Range**: 0.0 - 1.0  
**Use cases**: QA systems, educational assessments

### `answerRelevancy`

Asks an LLM judge how relevant the answer is to the question.

```ts
scorers.answerRelevancy();
```

**Range**: 0.0 - 1.0  
**Use cases**: Chat systems, search results

**Example**:

```ts
// Question: "What's the weather like?"
// Output: "It's sunny and 75°F"
// Score: 1.0 (highly relevant)

// Output: "I like pizza"
// Score: 0.0 (not relevant)
```

## Context evaluation

### `contextEntityRecall`

Uses an LLM judge to check whether the context mentions the expected entities.

```ts
scorers.contextEntityRecall();
```

**Range**: 0.0 - 1.0  
**Use cases**: Information extraction, entity recognition

### `contextPrecision`

Uses an LLM judge to assess how much of the retrieved context is relevant to the
question and expected answer. Pass the retrieved context as `output`.

```ts
scorers.contextPrecision();
```

**Range**: 0.0 - 1.0  
**Use cases**: RAG systems, context-aware generation

### `contextRecall`

Uses an LLM judge to assess whether the retrieved context supports all claims in
the expected answer. Pass the retrieved context as `output`.

```ts
scorers.contextRecall();
```

**Range**: 0.0 - 1.0  
**Use cases**: Reading comprehension, context utilization

### `contextRelevancy`

Uses an LLM judge to assess whether the retrieved context is relevant to the
question. Pass the retrieved context as `output`.

```ts
scorers.contextRelevancy();
```

**Range**: 0.0 - 1.0  
**Use cases**: Context filtering, relevance ranking

## Safety and moderation

### `moderation`

Asks an LLM judge to classify the output as safe or unsafe. This is a model-based
assessment, not a guarantee that an output is safe.

```ts
scorers.moderation();
```

**Range**: 0.0 - 1.0 (1.0 = safe, 0.0 = unsafe)  
**Use cases**: Content filtering, safety checks

**The judge checks for**:

- Hate speech
- Violence
- Self-harm
- Sexual content
- Harassment
- Dangerous or illegal activities

**Example**:

```ts
// Output: "Here's a helpful recipe for cookies"
// Score: 1.0 (safe content)

// Output: "Instructions for harmful activities"
// Score: 0.0 (unsafe content)
```

## Structured data

### `jsonDiff`

Compares JSON structures for differences.

```ts
scorers.jsonDiff();
```

**Range**: 0.0 - 1.0  
**Use cases**: API responses, structured output validation

**Example**:

```ts
// Output: '{"name": "John", "age": 30}'
// Expected: '{"name": "John", "age": 30}'
// Score: 1.0 (exact match)

// Output: '{"name": "John"}'
// Expected: '{"name": "John", "age": 30}'
// Score: 0.5 (partial match)
```

### `sql`

Asks an LLM judge whether the submitted SQL is equivalent to the expected query.
It does not execute queries or validate them against a database.

```ts
scorers.sql();
```

**Range**: 0.0 - 1.0  
**Use cases**: SQL generation, query validation

**Criteria**:

- Whether the queries would return equivalent results
- Whether the submitted query appears likely to fail
- Ignores whitespace, style, and output column naming differences

## Numeric and list comparison

### `numericDiff`

Calculates numerical difference between outputs.

```ts
scorers.numericDiff();
```

**Range**: 0.0 - 1.0  
**Use cases**: Mathematical calculations, numeric predictions

**Example**:

```ts
// Output: "42"
// Expected: "40"
// Score: ~0.95 (small difference)

// Output: "100"
// Expected: "40"
// Score: 0.4 (1 - 60 / 100)
```

### `listContains`

Verifies if a list contains expected items.

```ts
scorers.listContains();
```

**Range**: 0.0 - 1.0  
**Use cases**: List generation, item retrieval

**Example**:

```ts
// Output: ["apple", "banana", "cherry"]
// Expected: ["apple", "banana"]
// Score: 1.0 (contains all expected items)

// Output: ["apple"]
// Expected: ["apple", "banana"]
// Score: 0.5 (contains half of expected items)
```

## Specialized scorers

### `possible`

Asks an LLM judge whether a response offers a solution (1) or declares the task
impossible (0). It does not compare the response with `expected` or check whether
the proposed solution is correct.

```ts
scorers.possible();
```

**Range**: 0.0 - 1.0  
**Use cases**: Detecting declarations of impossibility versus solution attempts

**Example**:

```ts
// Input: "Write a haiku about rain."
// Output: "Rain taps on the roof / Rivers gather in the street / Clouds drift into dusk"
// Score: 1.0 (offers a solution)

// Output: "Writing a haiku about rain is impossible."
// Score: 0.0 (declares the task impossible)
```

### `humor`

Asks an LLM judge whether the output is funny: no (0), unsure (0.5), or yes (1).

```ts
scorers.humor();
```

**Range**: 0.0 - 1.0  
**Use cases**: Creative writing, entertainment content

This is a humor check, not a safety or appropriateness check. Use `moderation`
separately when needed.
