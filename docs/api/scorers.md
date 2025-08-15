# `scorers`

Viteval provides a comprehensive set of pre-built scorers for common evaluation scenarios, powered by the `autoevals` library.

## Import

```ts
import { scorers } from 'viteval';
```

## Text Similarity

### `exactMatch`

Returns 1 if output exactly matches expected, 0 otherwise.

```ts
scorers.exactMatch
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

Measures text similarity using edit distance algorithm.

```ts
scorers.levenshtein
```

**Range**: 0.0 - 1.0 (higher = more similar)  
**Use cases**: Approximate text matching, typo tolerance

**Example**:
```ts
// Output: "The sky is blue"
// Expected: "The sky is bleu"  
// Score: ~0.92 (small typo)

// Output: "Blue sky"
// Expected: "The sky is blue"
// Score: ~0.66 (partial match)
```

### `answerSimilarity`

Semantic similarity using embeddings.

```ts
scorers.answerSimilarity
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
scorers.embeddingSimilarity
```

**Range**: 0.0 - 1.0  
**Use cases**: Semantic search, content matching

**Features**:
- Uses state-of-the-art embedding models
- Captures semantic meaning beyond keywords
- Language-agnostic comparison

## Content Quality

### `factual`

Evaluates factual accuracy against ground truth.

```ts
scorers.factual
```

**Range**: 0.0 - 1.0  
**Use cases**: Knowledge-based QA, educational content

**Example**:
```ts
// Output: "Paris is the capital of France"
// Expected: "Paris"
// Score: 1.0 (factually correct)

// Output: "London is the capital of France"  
// Expected: "Paris"
// Score: 0.0 (factually incorrect)
```

### `summary`

Evaluates summary quality and completeness.

```ts
scorers.summary
```

**Range**: 0.0 - 1.0  
**Use cases**: Text summarization, content condensation

**Criteria**:
- Relevance to source material
- Completeness of key points
- Conciseness
- Accuracy

### `translation`

Assesses translation accuracy between languages.

```ts
scorers.translation
```

**Range**: 0.0 - 1.0  
**Use cases**: Machine translation, multilingual content

**Criteria**:
- Meaning preservation
- Grammar correctness
- Cultural appropriateness
- Fluency

## Answer Quality

### `answerCorrectness`

Measures how correct an answer is compared to expected.

```ts
scorers.answerCorrectness
```

**Range**: 0.0 - 1.0  
**Use cases**: QA systems, educational assessments

### `answerRelevancy`

Evaluates how relevant the answer is to the question.

```ts
scorers.answerRelevancy
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

## Context Evaluation

### `contextEntityRecall`

Checks if all expected entities are mentioned in context.

```ts
scorers.contextEntityRecall
```

**Range**: 0.0 - 1.0  
**Use cases**: Information extraction, entity recognition

### `contextPrecision`

Measures precision of context usage in responses.

```ts
scorers.contextPrecision
```

**Range**: 0.0 - 1.0  
**Use cases**: RAG systems, context-aware generation

### `contextRecall`

Evaluates how well context information is recalled.

```ts
scorers.contextRecall
```

**Range**: 0.0 - 1.0  
**Use cases**: Reading comprehension, context utilization

### `contextRelevancy`

Assesses relevance of provided context to the task.

```ts
scorers.contextRelevancy
```

**Range**: 0.0 - 1.0  
**Use cases**: Context filtering, relevance ranking

## Safety and Moderation

### `moderation`

Detects harmful, inappropriate, or unsafe content.

```ts
scorers.moderation
```

**Range**: 0.0 - 1.0 (1.0 = safe, 0.0 = unsafe)  
**Use cases**: Content filtering, safety checks

**Categories detected**:
- Hate speech
- Violence
- Self-harm
- Sexual content
- Harassment

**Example**:
```ts
// Output: "Here's a helpful recipe for cookies"
// Score: 1.0 (safe content)

// Output: "Instructions for harmful activities"
// Score: 0.0 (unsafe content)
```

## Structured Data

### `jsonDiff`

Compares JSON structures for differences.

```ts
scorers.jsonDiff
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

Validates SQL query syntax and correctness.

```ts
scorers.sql
```

**Range**: 0.0 - 1.0  
**Use cases**: SQL generation, query validation

**Criteria**:
- Syntax correctness
- Logical structure
- Expected results

## Numeric and List Comparison

### `numericDiff`

Calculates numerical difference between outputs.

```ts
scorers.numericDiff
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
// Score: ~0.0 (large difference)
```

### `listContains`

Verifies if a list contains expected items.

```ts
scorers.listContains
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

## Specialized Scorers

### `possible`

Checks if an answer is logically possible.

```ts
scorers.possible
```

**Range**: 0.0 - 1.0  
**Use cases**: Logical reasoning, plausibility checking

**Example**:
```ts
// Question: "How many wheels does a bicycle have?"
// Output: "2"
// Score: 1.0 (possible)

// Output: "7"
// Score: 0.0 (not possible)
```

### `humor`

Evaluates humor quality and appropriateness.

```ts
scorers.humor
```

**Range**: 0.0 - 1.0  
**Use cases**: Creative writing, entertainment content

**Criteria**:
- Humor presence
- Appropriateness
- Cleverness
- Timing

