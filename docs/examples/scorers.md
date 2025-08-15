# Custom Scorer Examples

Learn how to create custom scoring functions for specific evaluation needs.

## Basic Custom Scorers

### Simple Binary Scorer

```ts
import { createScorer } from 'viteval';

const containsKeyword = createScorer({
  name: 'contains-keyword',
  description: 'Checks if output contains a specific keyword',
  score: ({ output, metadata }) => {
    const keyword = metadata?.keyword || '';
    return output.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0;
  },
});

// Usage
evaluate('Keyword presence', {
  data: async () => [
    { 
      input: "Describe a cat", 
      expected: "A cat is a small furry animal",
      metadata: { keyword: 'furry' }
    },
  ],
  task: async (input) => await generateText(input),
  scorers: [containsKeyword],
  threshold: 1.0,
});
```

### Length-Based Scorer

```ts
const lengthConstraint = createScorer({
  name: 'length-constraint',
  description: 'Penalizes responses that are too long or too short',
  score: ({ output, expected }) => {
    const outputLen = output.length;
    const expectedLen = expected.length;
    const ratio = outputLen / expectedLen;
    
    // Ideal range: 0.8x to 1.5x the expected length
    if (ratio >= 0.8 && ratio <= 1.5) {
      return 1.0;
    } else if (ratio >= 0.5 && ratio <= 2.0) {
      return 0.5; // Partial credit
    } else {
      return 0.0;
    }
  },
});
```

## Advanced Scoring Patterns

### Threshold-Based Scorer

```ts
function createThresholdScorer(baseScorer: Scorer, threshold: number) {
  return createScorer({
    name: `${baseScorer.name}-threshold-${threshold}`,
    description: `${baseScorer.description} with ${threshold} threshold`,
    score: async (context) => {
      const baseScore = await baseScorer.score(context);
      return baseScore >= threshold ? 1 : 0;
    },
  });
}

// Usage
const strictSimilarity = createThresholdScorer(scorers.answerSimilarity, 0.9);
```

### Multi-Criteria Scorer

```ts
const comprehensiveQuality = createScorer({
  name: 'comprehensive-quality',
  description: 'Evaluates multiple aspects of response quality',
  score: ({ output, expected }) => {
    let totalScore = 0;
    let criteria = 0;
    
    // Criterion 1: Length appropriateness (25%)
    const lengthRatio = output.length / expected.length;
    if (lengthRatio >= 0.7 && lengthRatio <= 1.3) {
      totalScore += 0.25;
    }
    criteria++;
    
    // Criterion 2: Contains key terms (25%)
    const expectedWords = expected.toLowerCase().split(/\s+/);
    const outputWords = output.toLowerCase().split(/\s+/);
    const overlap = expectedWords.filter(word => outputWords.includes(word));
    totalScore += (overlap.length / expectedWords.length) * 0.25;
    criteria++;
    
    // Criterion 3: Proper capitalization (25%)
    const isProperlyCapitalized = /^[A-Z]/.test(output);
    if (isProperlyCapitalized) {
      totalScore += 0.25;
    }
    criteria++;
    
    // Criterion 4: Ends with punctuation (25%)
    const endsWithPunctuation = /[.!?]$/.test(output.trim());
    if (endsWithPunctuation) {
      totalScore += 0.25;
    }
    criteria++;
    
    return totalScore;
  },
});
```

## Domain-Specific Scorers

### Code Quality Scorer

```ts
const pythonCodeQuality = createScorer({
  name: 'python-code-quality',
  description: 'Evaluates Python code quality and correctness',
  score: ({ output }) => {
    let score = 0;
    
    // Check syntax (basic)
    const hasFunctionDef = output.includes('def ');
    const hasReturn = output.includes('return');
    const hasProperIndentation = /\n    /.test(output);
    
    if (hasFunctionDef) score += 0.4;
    if (hasReturn) score += 0.3;
    if (hasProperIndentation) score += 0.3;
    
    return score;
  },
});
```

### SQL Query Scorer

```ts
const sqlCorrectness = createScorer({
  name: 'sql-correctness',
  description: 'Validates SQL query structure and keywords',
  score: ({ output, metadata }) => {
    const sql = output.toUpperCase();
    let score = 0;
    
    // Required keywords based on query type
    const queryType = metadata?.queryType || 'SELECT';
    
    switch (queryType) {
      case 'SELECT':
        if (sql.includes('SELECT')) score += 0.3;
        if (sql.includes('FROM')) score += 0.3;
        if (sql.includes('WHERE')) score += 0.2;
        if (sql.includes(';')) score += 0.2;
        break;
      case 'INSERT':
        if (sql.includes('INSERT INTO')) score += 0.4;
        if (sql.includes('VALUES')) score += 0.3;
        if (sql.includes(';')) score += 0.3;
        break;
    }
    
    return score;
  },
});
```

### JSON Structure Scorer

```ts
const jsonStructureMatch = createScorer({
  name: 'json-structure',
  description: 'Validates JSON structure matches expected schema',
  score: ({ output, metadata }) => {
    try {
      const outputJson = JSON.parse(output);
      const requiredFields = metadata?.requiredFields || [];
      
      let score = 0;
      for (const field of requiredFields) {
        if (outputJson.hasOwnProperty(field)) {
          score += 1 / requiredFields.length;
        }
      }
      
      return score;
    } catch (error) {
      return 0; // Invalid JSON
    }
  },
});

// Usage
evaluate('API response format', {
  data: async () => [
    {
      input: "Get user information",
      expected: '{"id": 1, "name": "John", "email": "john@example.com"}',
      metadata: { requiredFields: ['id', 'name', 'email'] }
    }
  ],
  scorers: [jsonStructureMatch],
  // ...
});
```

## Async Scorers

### External API Scorer

```ts
const sentimentAlignment = createScorer({
  name: 'sentiment-alignment',
  description: 'Compares sentiment using external sentiment analysis API',
  score: async ({ output, expected }) => {
    try {
      const [outputSentiment, expectedSentiment] = await Promise.all([
        analyzeSentiment(output),
        analyzeSentiment(expected),
      ]);
      
      // Return 1 if sentiments match, 0.5 if neutral, 0 if opposite
      if (outputSentiment.label === expectedSentiment.label) {
        return 1.0;
      } else if (outputSentiment.label === 'neutral' || expectedSentiment.label === 'neutral') {
        return 0.5;
      } else {
        return 0.0;
      }
    } catch (error) {
      console.warn('Sentiment analysis failed:', error);
      return 0.5; // Default to neutral on error
    }
  },
});

async function analyzeSentiment(text: string) {
  const response = await fetch('https://api.sentiment-analyzer.com/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return response.json();
}
```

### Database Lookup Scorer

```ts
const factCheckDatabase = createScorer({
  name: 'fact-check-db',
  description: 'Verifies facts against a knowledge database',
  score: async ({ output, input }) => {
    try {
      const facts = await queryFactDatabase(input);
      
      let matchCount = 0;
      for (const fact of facts) {
        if (output.toLowerCase().includes(fact.toLowerCase())) {
          matchCount++;
        }
      }
      
      return facts.length > 0 ? matchCount / facts.length : 0;
    } catch (error) {
      return 0;
    }
  },
});
```

## Composite Scorers

### Weighted Combination

```ts
function createWeightedScorer(scorerWeights: Array<{ scorer: Scorer; weight: number }>) {
  const totalWeight = scorerWeights.reduce((sum, { weight }) => sum + weight, 0);
  
  return createScorer({
    name: 'weighted-composite',
    description: 'Weighted combination of multiple scorers',
    score: async (context) => {
      const scores = await Promise.all(
        scorerWeights.map(async ({ scorer, weight }) => {
          const score = await scorer.score(context);
          return score * weight;
        })
      );
      
      return scores.reduce((sum, score) => sum + score, 0) / totalWeight;
    },
  });
}

// Usage
const balancedScorer = createWeightedScorer([
  { scorer: scorers.factual, weight: 0.5 },
  { scorer: scorers.answerSimilarity, weight: 0.3 },
  { scorer: scorers.moderation, weight: 0.2 },
]);
```

### Conditional Scorer

```ts
const conditionalScorer = createScorer({
  name: 'conditional-scorer',
  description: 'Uses different scoring based on input type',
  score: async (context) => {
    const { input, output, expected, metadata } = context;
    
    // Choose scorer based on metadata or input content
    if (metadata?.type === 'code') {
      return await pythonCodeQuality.score(context);
    } else if (metadata?.type === 'math') {
      return await scorers.numericDiff.score(context);
    } else {
      return await scorers.answerSimilarity.score(context);
    }
  },
});
```

## Stateful Scorers

### Learning Scorer

```ts
class AdaptiveScorer {
  private scores: number[] = [];
  private threshold = 0.8;
  
  createScorer() {
    return createScorer({
      name: 'adaptive-scorer',
      description: 'Adapts threshold based on historical performance',
      score: ({ output, expected }) => {
        const similarity = calculateSimilarity(output, expected);
        this.scores.push(similarity);
        
        // Adapt threshold based on recent performance
        if (this.scores.length >= 10) {
          const recentScores = this.scores.slice(-10);
          const average = recentScores.reduce((a, b) => a + b, 0) / 10;
          this.threshold = Math.max(0.6, Math.min(0.9, average));
        }
        
        return similarity >= this.threshold ? 1 : 0;
      },
    });
  }
}

const adaptiveScorer = new AdaptiveScorer().createScorer();
```

### Context-Aware Scorer

```ts
class ContextAwareScorer {
  private context: Map<string, any> = new Map();
  
  createScorer() {
    return createScorer({
      name: 'context-aware',
      description: 'Considers previous responses in conversation',
      score: ({ input, output, metadata }) => {
        const conversationId = metadata?.conversationId || 'default';
        const previousResponses = this.context.get(conversationId) || [];
        
        // Check for repetition
        const isRepetitive = previousResponses.some(prev => 
          calculateSimilarity(output, prev) > 0.9
        );
        
        // Update context
        previousResponses.push(output);
        this.context.set(conversationId, previousResponses.slice(-5)); // Keep last 5
        
        // Penalize repetitive responses
        return isRepetitive ? 0.3 : 1.0;
      },
    });
  }
}
```

## Performance Optimization

### Cached Scorer

```ts
const cachedScorer = (() => {
  const cache = new Map<string, number>();
  
  return createScorer({
    name: 'cached-expensive-scorer',
    description: 'Caches results of expensive scoring operations',
    score: async ({ output, expected }) => {
      const key = `${output}|||${expected}`;
      
      if (cache.has(key)) {
        return cache.get(key)!;
      }
      
      const score = await expensiveScoring(output, expected);
      cache.set(key, score);
      
      // Limit cache size
      if (cache.size > 1000) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      return score;
    },
  });
})();
```

### Parallel Scorer

```ts
const parallelScorer = createScorer({
  name: 'parallel-multi-check',
  description: 'Runs multiple checks in parallel',
  score: async (context) => {
    const checks = await Promise.all([
      checkGrammar(context.output),
      checkFactualness(context.output),
      checkRelevance(context.output, context.input),
    ]);
    
    // Average the results
    return checks.reduce((sum, score) => sum + score, 0) / checks.length;
  },
});
```

## Testing Custom Scorers

### Unit Testing Scorers

```ts
// In your test files
describe('containsKeyword scorer', () => {
  it('should return 1 when keyword is present', () => {
    const result = containsKeyword.score({
      input: 'test',
      output: 'The cat is furry',
      expected: 'furry animal',
      metadata: { keyword: 'furry' }
    });
    
    expect(result).toBe(1);
  });
  
  it('should return 0 when keyword is missing', () => {
    const result = containsKeyword.score({
      input: 'test',
      output: 'The cat is small',
      expected: 'furry animal',
      metadata: { keyword: 'furry' }
    });
    
    expect(result).toBe(0);
  });
});
```

### Scorer Evaluation

```ts
// Test your scorer against known good/bad examples
evaluate('Scorer validation', {
  data: async () => [
    // Known good examples (should score high)
    { input: 'good', output: 'excellent response', expected: 'good', metadata: { shouldScore: 'high' } },
    // Known bad examples (should score low)
    { input: 'bad', output: 'poor response', expected: 'good', metadata: { shouldScore: 'low' } },
  ],
  task: async (input) => input, // Pass through
  scorers: [yourCustomScorer],
  threshold: 0.5,
});
```

## Best Practices

### Error Handling

```ts
const robustScorer = createScorer({
  name: 'robust-scorer',
  score: ({ output, expected }) => {
    try {
      return complexScoringLogic(output, expected);
    } catch (error) {
      console.warn(`Scoring failed: ${error.message}`);
      return 0; // Fail gracefully
    }
  },
});
```

### Input Validation

```ts
const validatingScorer = createScorer({
  name: 'validating-scorer',
  score: ({ output, expected }) => {
    // Validate inputs
    if (!output || typeof output !== 'string') return 0;
    if (!expected || typeof expected !== 'string') return 0;
    if (output.length === 0) return 0;
    
    // Proceed with scoring
    return calculateScore(output, expected);
  },
});
```

### Documentation

```ts
const wellDocumentedScorer = createScorer({
  name: 'well-documented-scorer',
  description: 'Clear description of what this scorer measures and how',
  score: ({ output, expected }) => {
    // Implementation
    return score;
  },
  metadata: {
    author: 'team@company.com',
    version: '1.0.0',
    category: 'similarity',
    requirements: ['string inputs'],
    returnRange: '[0, 1]',
  },
});
```