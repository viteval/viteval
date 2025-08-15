# createScorer()

The `createScorer()` function allows you to create custom scoring functions for evaluating LLM outputs.

## Signature

```ts
function createScorer<T = any>(
  options: ScorerOptions<T>
): Scorer<T>
```

## Parameters

### `options`
- **Type**: `ScorerOptions<T>`
- **Required**: Yes
- **Description**: Configuration object for the scorer

## ScorerOptions

```ts
interface ScorerOptions<T = any> {
  name: string;
  score: ScorerFunction<T>;
  description?: string;
  metadata?: Record<string, any>;
}
```

### `name`

Unique identifier for the scorer.

**Type**: `string`  
**Required**: Yes

```ts
createScorer({
  name: 'exact-match',
  // ...
});
```

### `score`

Function that calculates the score for an output.

**Type**: `ScorerFunction<T>`  
**Required**: Yes

```ts
interface ScorerFunction<T = any> {
  (context: ScorerContext<T>): Promise<number> | number;
}

interface ScorerContext<T = any> {
  input: T;
  output: string;
  expected: string;
  metadata?: Record<string, any>;
}
```

The function should return a number between 0 and 1, where:
- `1.0` = Perfect score
- `0.0` = Complete failure
- `0.5` = Partial success

### `description` (optional)

Human-readable description of what the scorer measures.

**Type**: `string`

```ts
description: 'Measures exact string equality between output and expected'
```

### `metadata` (optional)

Additional information about the scorer.

**Type**: `Record<string, any>`

```ts
metadata: {
  category: 'similarity',
  author: 'team@company.com',
  version: '1.0.0',
}
```

## Return Value

Returns a `Scorer<T>` object that can be used in evaluations:

```ts
interface Scorer<T = any> {
  name: string;
  score: ScorerFunction<T>;
  description?: string;
  metadata?: Record<string, any>;
}
```

## Examples

### Basic String Comparison

```ts
const exactMatch = createScorer({
  name: 'exact-match',
  description: 'Returns 1 if strings match exactly, 0 otherwise',
  score: ({ output, expected }) => {
    return output.trim() === expected.trim() ? 1 : 0;
  },
});
```

### Length-Based Scoring

```ts
const lengthSimilarity = createScorer({
  name: 'length-similarity',
  description: 'Scores based on how similar the output length is to expected',
  score: ({ output, expected }) => {
    const outputLen = output.length;
    const expectedLen = expected.length;
    const maxLen = Math.max(outputLen, expectedLen);
    
    if (maxLen === 0) return 1;
    
    const diff = Math.abs(outputLen - expectedLen);
    return Math.max(0, 1 - diff / maxLen);
  },
});
```

### Numeric Scoring

```ts
const numericAccuracy = createScorer({
  name: 'numeric-accuracy',
  description: 'Compares numeric values with tolerance',
  score: ({ output, expected }) => {
    const outputNum = parseFloat(output);
    const expectedNum = parseFloat(expected);
    
    if (isNaN(outputNum) || isNaN(expectedNum)) {
      return 0;
    }
    
    const tolerance = 0.01; // 1% tolerance
    const diff = Math.abs(outputNum - expectedNum);
    const avgValue = (Math.abs(outputNum) + Math.abs(expectedNum)) / 2;
    
    if (avgValue === 0) return outputNum === expectedNum ? 1 : 0;
    
    return diff / avgValue <= tolerance ? 1 : 0;
  },
});
```

### Keyword-Based Scoring

```ts
const keywordPresence = createScorer({
  name: 'keyword-presence',
  description: 'Scores based on presence of required keywords',
  score: ({ output, expected, metadata }) => {
    const requiredKeywords = metadata?.keywords || [];
    const outputLower = output.toLowerCase();
    
    if (requiredKeywords.length === 0) return 1;
    
    const foundKeywords = requiredKeywords.filter(keyword =>
      outputLower.includes(keyword.toLowerCase())
    );
    
    return foundKeywords.length / requiredKeywords.length;
  },
});

// Usage with metadata
evaluate('Keyword test', {
  data: async () => [
    {
      input: "Describe a cat",
      expected: "A cat is a small, furry animal",
      metadata: { keywords: ['small', 'furry', 'animal'] }
    }
  ],
  scorers: [keywordPresence],
  // ...
});
```

### Async Scoring with External APIs

```ts
const sentimentAlignment = createScorer({
  name: 'sentiment-alignment',
  description: 'Compares sentiment of output vs expected using external API',
  score: async ({ output, expected }) => {
    try {
      const [outputSentiment, expectedSentiment] = await Promise.all([
        analyzeSentiment(output),
        analyzeSentiment(expected),
      ]);
      
      // Simple sentiment comparison
      return outputSentiment.label === expectedSentiment.label ? 1 : 0;
    } catch (error) {
      console.warn('Sentiment analysis failed:', error);
      return 0; // Default to failure if API unavailable
    }
  },
});
```

### JSON Structure Scoring

```ts
const jsonStructureMatch = createScorer({
  name: 'json-structure',
  description: 'Validates JSON structure matches expected schema',
  score: ({ output, expected }) => {
    try {
      const outputJson = JSON.parse(output);
      const expectedJson = JSON.parse(expected);
      
      // Check if all expected keys are present
      const expectedKeys = Object.keys(expectedJson);
      const outputKeys = Object.keys(outputJson);
      
      const matchingKeys = expectedKeys.filter(key => 
        outputKeys.includes(key)
      );
      
      return matchingKeys.length / expectedKeys.length;
    } catch (error) {
      return 0; // Invalid JSON
    }
  },
});
```

### Multi-Criteria Scoring

```ts
const comprehensiveQuality = createScorer({
  name: 'comprehensive-quality',
  description: 'Multi-factor quality assessment',
  score: ({ input, output, expected }) => {
    let score = 0;
    let factors = 0;
    
    // Factor 1: Length appropriateness (25%)
    const lengthRatio = output.length / expected.length;
    if (lengthRatio >= 0.5 && lengthRatio <= 2.0) {
      score += 0.25;
    }
    factors++;
    
    // Factor 2: Contains key terms (25%)
    const expectedWords = expected.toLowerCase().split(/\s+/);
    const outputWords = output.toLowerCase().split(/\s+/);
    const commonWords = expectedWords.filter(word => 
      outputWords.includes(word)
    );
    score += (commonWords.length / expectedWords.length) * 0.25;
    factors++;
    
    // Factor 3: Starts appropriately (25%)
    if (output.toLowerCase().startsWith(expected.split(' ')[0].toLowerCase())) {
      score += 0.25;
    }
    factors++;
    
    // Factor 4: Ends appropriately (25%)
    const expectedEnd = expected.split(' ').slice(-1)[0].toLowerCase();
    if (output.toLowerCase().endsWith(expectedEnd)) {
      score += 0.25;
    }
    factors++;
    
    return score;
  },
});
```

## Advanced Patterns

### Configurable Scorers

```ts
function createThresholdScorer(threshold: number = 0.8) {
  return createScorer({
    name: `threshold-${threshold}`,
    description: `Pass/fail scorer with ${threshold} threshold`,
    score: ({ output, expected }) => {
      const similarity = calculateSimilarity(output, expected);
      return similarity >= threshold ? 1 : 0;
    },
    metadata: { threshold },
  });
}

const strictScorer = createThresholdScorer(0.95);
const lenientScorer = createThresholdScorer(0.6);
```

### Scorer with State

```ts
class StatefulScorer {
  private scores: number[] = [];
  
  createScorer() {
    return createScorer({
      name: 'stateful-scorer',
      score: ({ output, expected }) => {
        const score = calculateScore(output, expected);
        this.scores.push(score);
        
        // Adaptive scoring based on running average
        const average = this.scores.reduce((a, b) => a + b, 0) / this.scores.length;
        return score >= average ? 1 : 0;
      },
    });
  }
  
  getStatistics() {
    return {
      average: this.scores.reduce((a, b) => a + b, 0) / this.scores.length,
      count: this.scores.length,
    };
  }
}
```

### Composite Scorer

```ts
function createCompositeScorer(scorers: Scorer[], weights?: number[]) {
  const normalizedWeights = weights || scorers.map(() => 1 / scorers.length);
  
  return createScorer({
    name: 'composite-scorer',
    description: 'Weighted combination of multiple scorers',
    score: async (context) => {
      const scores = await Promise.all(
        scorers.map(scorer => scorer.score(context))
      );
      
      return scores.reduce((sum, score, index) => 
        sum + score * normalizedWeights[index], 0
      );
    },
    metadata: {
      component_scorers: scorers.map(s => s.name),
      weights: normalizedWeights,
    },
  });
}

// Usage
const qualityScorer = createCompositeScorer([
  scorers.factual,
  scorers.answerSimilarity,
  customRelevanceScorer,
], [0.4, 0.4, 0.2]); // 40% factual, 40% similarity, 20% relevance
```

## Best Practices

### Error Handling

```ts
const robustScorer = createScorer({
  name: 'robust-scorer',
  score: ({ output, expected }) => {
    try {
      // Scoring logic that might fail
      return complexScoringFunction(output, expected);
    } catch (error) {
      console.warn(`Scoring failed: ${error.message}`);
      return 0; // Default to failure on error
    }
  },
});
```

### Performance Optimization

```ts
// Cache expensive computations
const cache = new Map();

const optimizedScorer = createScorer({
  name: 'optimized-scorer',
  score: ({ output, expected }) => {
    const key = `${output}|${expected}`;
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const score = expensiveScoring(output, expected);
    cache.set(key, score);
    
    return score;
  },
});
```

### Input Validation

```ts
const validatingScorer = createScorer({
  name: 'validating-scorer',
  score: ({ output, expected }) => {
    // Validate inputs
    if (typeof output !== 'string' || typeof expected !== 'string') {
      return 0;
    }
    
    if (output.length === 0 || expected.length === 0) {
      return 0;
    }
    
    // Actual scoring logic
    return calculateScore(output, expected);
  },
});
```