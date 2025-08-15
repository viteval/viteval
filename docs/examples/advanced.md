# Advanced Examples

Complex evaluation patterns and real-world scenarios.

## Multi-Modal Evaluations

### Image Description Evaluation

```ts
interface ImageInput {
  imageUrl: string;
  prompt: string;
}

evaluate<ImageInput>('Image descriptions', {
  data: async () => [
    {
      input: {
        imageUrl: 'https://example.com/cat.jpg',
        prompt: 'Describe this image'
      },
      expected: 'A fluffy orange cat sitting on a windowsill',
    },
  ],
  task: async ({ imageUrl, prompt }) => {
    return await describeImage(imageUrl, prompt);
  },
  scorers: [scorers.answerSimilarity, customImageScorer],
  threshold: 0.8,
});
```

### Code Review Evaluation

```ts
interface CodeReviewInput {
  code: string;
  language: string;
  context: string;
}

const codeReviewScorer = createScorer({
  name: 'code-review-quality',
  score: ({ output }) => {
    let score = 0;
    
    // Check for constructive feedback
    const hasPositive = /good|well|nice|excellent/i.test(output);
    const hasImprovement = /improve|consider|suggest|could/i.test(output);
    const hasSpecific = /line \d+|function|variable|method/i.test(output);
    
    if (hasPositive) score += 0.3;
    if (hasImprovement) score += 0.4;
    if (hasSpecific) score += 0.3;
    
    return score;
  },
});

evaluate<CodeReviewInput>('Code review quality', {
  data: async () => loadCodeReviewCases(),
  task: async ({ code, language, context }) => {
    return await reviewCode(code, language, context);
  },
  scorers: [codeReviewScorer, scorers.moderation],
  threshold: 0.7,
});
```

## Conversation Evaluation

### Multi-Turn Dialogue

```ts
interface ConversationTurn {
  speaker: 'user' | 'assistant';
  message: string;
}

interface ConversationInput {
  history: ConversationTurn[];
  newMessage: string;
}

const conversationCoherence = createScorer({
  name: 'conversation-coherence',
  score: ({ input, output }) => {
    const { history, newMessage } = input as ConversationInput;
    
    // Check if response acknowledges previous context
    const lastUserMessage = history
      .filter(turn => turn.speaker === 'user')
      .pop()?.message || '';
    
    const contextWords = lastUserMessage.toLowerCase().split(/\s+/);
    const responseWords = output.toLowerCase().split(/\s+/);
    
    const overlap = contextWords.filter(word => 
      responseWords.includes(word) && word.length > 3
    );
    
    return Math.min(1, overlap.length / Math.max(1, contextWords.length * 0.3));
  },
});

evaluate<ConversationInput>('Conversation flow', {
  data: async () => loadConversationData(),
  task: async ({ history, newMessage }) => {
    return await generateResponse(history, newMessage);
  },
  scorers: [conversationCoherence, scorers.answerRelevancy],
  threshold: 0.75,
});
```

## A/B Testing Evaluations

### Model Comparison

```ts
const models = ['gpt-4', 'claude-3-sonnet', 'gpt-3.5-turbo'];

for (const model of models) {
  evaluate(`${model} performance`, {
    data: async () => await loadCommonTestSet(),
    task: async (input) => {
      return await generateWithModel(input, model);
    },
    scorers: [
      scorers.factual,
      scorers.answerSimilarity,
      scorers.moderation,
    ],
    threshold: 0.8,
    metadata: { model, timestamp: Date.now() },
  });
}
```

### Prompt Engineering

```ts
const prompts = [
  "Answer the following question: {input}",
  "Please provide a detailed answer to: {input}",
  "Think step by step and answer: {input}",
];

for (const [index, promptTemplate] of prompts.entries()) {
  evaluate(`Prompt variant ${index + 1}`, {
    data: async () => await loadQuestions(),
    task: async (input) => {
      const prompt = promptTemplate.replace('{input}', input);
      return await generateText(prompt);
    },
    scorers: [scorers.factual, scorers.answerSimilarity],
    threshold: 0.8,
    metadata: { promptTemplate, variant: index + 1 },
  });
}
```

## Production Evaluation Pipeline

### Continuous Evaluation

```ts
// evaluation-pipeline.ts
import { evaluate, scorers } from 'viteval';
import { loadProductionSamples } from './data-pipeline';

const runProductionEval = async () => {
  const samples = await loadProductionSamples();
  
  evaluate('Production quality check', {
    data: async () => samples,
    task: async (input) => {
      // Use the same model as production
      return await productionModel.generate(input);
    },
    scorers: [
      scorers.factual,
      scorers.moderation,
      scorers.answerRelevancy,
    ],
    threshold: 0.85,
    metadata: {
      environment: 'production',
      timestamp: new Date().toISOString(),
      version: process.env.MODEL_VERSION,
    },
  });
};

// Run every hour
setInterval(runProductionEval, 60 * 60 * 1000);
```

### Regression Testing

```ts
const regressionSuite = defineDataset({
  name: 'regression-tests',
  data: async () => {
    // Load golden dataset that should never regress
    const goldenCases = await loadGoldenDataset();
    
    // Add recent production failures
    const recentFailures = await loadRecentFailures();
    
    return [...goldenCases, ...recentFailures];
  },
  cache: false, // Always get fresh data
});

evaluate('Regression check', {
  data: () => regressionSuite.data(),
  task: async (input) => await currentModel.generate(input),
  scorers: [scorers.exactMatch], // Strict for regression
  threshold: 0.95, // Very high bar
});
```

## Performance Benchmarking

### Latency Evaluation

```ts
const latencyScorer = createScorer({
  name: 'latency-scorer',
  description: 'Penalizes responses that take too long',
  score: async ({ input }) => {
    const start = Date.now();
    await generateResponse(input);
    const latency = Date.now() - start;
    
    // Penalty for responses > 2 seconds
    if (latency > 2000) return 0.5;
    if (latency > 1000) return 0.8;
    return 1.0;
  },
});

evaluate('Response speed', {
  data: async () => loadPerformanceTestCases(),
  task: async (input) => {
    const start = Date.now();
    const response = await generateResponse(input);
    const latency = Date.now() - start;
    
    // Include latency in response for analysis
    return JSON.stringify({ response, latency });
  },
  scorers: [latencyScorer],
  threshold: 0.8,
});
```

### Load Testing

```ts
evaluate('Concurrent load test', {
  data: async () => {
    // Generate many identical requests
    return Array(100).fill({
      input: "What is the capital of France?",
      expected: "Paris",
    });
  },
  task: async (input) => {
    // All requests will hit the API simultaneously
    return await generateResponse(input);
  },
  scorers: [scorers.exactMatch, latencyScorer],
  threshold: 0.9,
  timeout: 10000, // 10 second timeout
});
```

## Safety and Compliance

### Content Safety Pipeline

```ts
const comprehensiveSafety = createScorer({
  name: 'comprehensive-safety',
  score: async ({ output }) => {
    const checks = await Promise.all([
      scorers.moderation.score({ output }),
      checkPII(output),
      checkToxicity(output),
      checkBias(output),
    ]);
    
    // All safety checks must pass
    return Math.min(...checks);
  },
});

evaluate('Safety compliance', {
  data: async () => loadSafetyTestCases(),
  task: async (input) => await generateResponse(input),
  scorers: [comprehensiveSafety],
  threshold: 0.95, // Very high safety bar
});
```

### GDPR Compliance Check

```ts
const gdprCompliance = createScorer({
  name: 'gdpr-compliance',
  score: ({ output }) => {
    // Check for personal data patterns
    const patterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
    ];
    
    const violations = patterns.filter(pattern => pattern.test(output));
    return violations.length === 0 ? 1 : 0;
  },
});
```

## Domain-Specific Evaluations

### Medical AI Evaluation

```ts
const medicalAccuracy = createScorer({
  name: 'medical-accuracy',
  score: async ({ output, input }) => {
    // Use medical knowledge base for verification
    const medicalFacts = await queryMedicalDatabase(input);
    const contradictions = checkMedicalContradictions(output, medicalFacts);
    
    if (contradictions.length > 0) return 0;
    
    const supportedClaims = countSupportedClaims(output, medicalFacts);
    const totalClaims = countMedicalClaims(output);
    
    return totalClaims > 0 ? supportedClaims / totalClaims : 0.5;
  },
});

evaluate('Medical question answering', {
  data: async () => loadMedicalQA(),
  task: async (input) => {
    const disclaimer = "This is for educational purposes only. Consult a healthcare professional.";
    const response = await generateMedicalResponse(input);
    return `${response}\n\n${disclaimer}`;
  },
  scorers: [medicalAccuracy, scorers.moderation],
  threshold: 0.9,
});
```

### Legal AI Evaluation

```ts
const legalPrecision = createScorer({
  name: 'legal-precision',
  score: ({ output }) => {
    // Check for appropriate legal disclaimers
    const hasDisclaimer = /not legal advice|consult.*attorney|for informational purposes/i.test(output);
    
    // Check for overly specific legal advice (should be avoided)
    const tooSpecific = /you should definitely|the court will|guaranteed outcome/i.test(output);
    
    if (!hasDisclaimer) return 0.3;
    if (tooSpecific) return 0.5;
    return 1.0;
  },
});
```

## Custom Reporting

### Detailed Analysis Report

```ts
const generateAnalysisReport = createScorer({
  name: 'analysis-reporter',
  score: ({ input, output, expected, metadata }) => {
    // Store detailed analysis for later reporting
    const analysis = {
      timestamp: new Date().toISOString(),
      input,
      output,
      expected,
      outputLength: output.length,
      expectedLength: expected.length,
      topic: metadata?.topic,
      difficulty: metadata?.difficulty,
    };
    
    // Store to database or file for analysis
    storeAnalysis(analysis);
    
    // Return actual score
    return calculateSimilarity(output, expected);
  },
});

async function storeAnalysis(analysis: any) {
  // Store to your analytics system
  await analyticsDB.insert('evaluation_results', analysis);
}
```

### Real-time Monitoring

```ts
class EvaluationMonitor {
  private metrics = {
    totalEvaluations: 0,
    passedEvaluations: 0,
    avgScore: 0,
    recentScores: [] as number[],
  };
  
  createMonitoringScorer() {
    return createScorer({
      name: 'monitoring-scorer',
      score: ({ output, expected }) => {
        const score = calculateScore(output, expected);
        
        this.updateMetrics(score);
        this.checkAlerts(score);
        
        return score;
      },
    });
  }
  
  private updateMetrics(score: number) {
    this.metrics.totalEvaluations++;
    if (score >= 0.8) this.metrics.passedEvaluations++;
    
    this.metrics.recentScores.push(score);
    if (this.metrics.recentScores.length > 100) {
      this.metrics.recentScores.shift();
    }
    
    this.metrics.avgScore = this.metrics.recentScores.reduce((a, b) => a + b, 0) / this.metrics.recentScores.length;
  }
  
  private checkAlerts(score: number) {
    // Alert if recent average drops below threshold
    if (this.metrics.avgScore < 0.7 && this.metrics.recentScores.length >= 10) {
      console.warn('⚠️ Model performance degradation detected!');
    }
    
    // Alert on consecutive failures
    const recentFive = this.metrics.recentScores.slice(-5);
    if (recentFive.length === 5 && recentFive.every(s => s < 0.5)) {
      console.error('🚨 Critical: 5 consecutive failures!');
    }
  }
  
  getMetrics() {
    return this.metrics;
  }
}

const monitor = new EvaluationMonitor();
const monitoringScorer = monitor.createMonitoringScorer();
```

## Integration Patterns

### CI/CD Pipeline Integration

```bash
#!/bin/bash
# .github/workflows/model-evaluation.yml

# Run evaluations before deployment
npm run build
viteval --reporter json > eval-results.json

# Check if evaluations passed
if [ $? -eq 0 ]; then
  echo "✅ All evaluations passed"
  npm run deploy
else
  echo "❌ Evaluations failed - blocking deployment"
  exit 1
fi

# Upload results to monitoring system
curl -X POST https://monitoring.company.com/evaluations \
  -H "Content-Type: application/json" \
  -d @eval-results.json
```

### Slack Integration

```ts
const slackReporter = createScorer({
  name: 'slack-reporter',
  score: async ({ input, output, expected }) => {
    const score = calculateScore(output, expected);
    
    // Report failures to Slack
    if (score < 0.5) {
      await sendSlackAlert({
        channel: '#ai-alerts',
        message: `🚨 Evaluation failure detected:
Input: ${input}
Output: ${output}
Expected: ${expected}
Score: ${score}`,
      });
    }
    
    return score;
  },
});
```

## Best Practices for Advanced Scenarios

### Error Recovery

```ts
const resilientEvaluation = async () => {
  try {
    await evaluate('Primary evaluation', primaryConfig);
  } catch (error) {
    console.warn('Primary evaluation failed, running fallback');
    await evaluate('Fallback evaluation', fallbackConfig);
  }
};
```

### Resource Management

```ts
// Limit concurrent evaluations to prevent overload
const semaphore = new Semaphore(3); // Max 3 concurrent

evaluate('Resource-conscious eval', {
  data: async () => largeDateset,
  task: async (input) => {
    await semaphore.acquire();
    try {
      return await expensiveTask(input);
    } finally {
      semaphore.release();
    }
  },
  scorers: [scorers.factual],
  threshold: 0.8,
});
```

### Graceful Degradation

```ts
const adaptiveEvaluation = createScorer({
  name: 'adaptive-evaluation',
  score: async (context) => {
    try {
      // Try expensive, accurate scoring first
      return await expensiveAccurateScorer.score(context);
    } catch (error) {
      console.warn('Expensive scorer failed, using fallback');
      try {
        // Fall back to simpler scoring
        return await simpleScorer.score(context);
      } catch (fallbackError) {
        console.warn('Fallback scorer failed, using basic comparison');
        // Ultimate fallback
        return context.output === context.expected ? 1 : 0;
      }
    }
  },
});
```