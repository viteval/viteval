# CI/CD Integration

Learn how to integrate Viteval into your continuous integration and deployment pipelines to ensure consistent LLM performance.

## Overview

Viteval is designed to work seamlessly in CI/CD environments, allowing you to:

- Run evaluations automatically on code changes
- Gate deployments based on evaluation results
- Track performance regressions over time
- Generate evaluation reports

## GitHub Actions

### Basic Setup

Create `.github/workflows/viteval.yml`:

```yaml
name: LLM Evaluation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  evaluate:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run evaluations
      run: npx viteval run
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        
    - name: Upload results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: evaluation-results
        path: viteval-results/
```

### Advanced Configuration

For more complex setups with different evaluation strategies:

```yaml
name: Multi-Stage LLM Evaluation

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  quick-eval:
    runs-on: ubuntu-latest
    outputs:
      should-run-full: ${{ steps.check.outputs.should-run-full }}
    
    steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
      
    - name: Run quick evaluations
      run: npx viteval run --config viteval.quick.config.ts
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        
    - name: Check if full evaluation needed
      id: check
      run: |
        if [ "${{ github.event_name }}" = "push" ] && [ "${{ github.ref }}" = "refs/heads/main" ]; then
          echo "should-run-full=true" >> $GITHUB_OUTPUT
        else
          echo "should-run-full=false" >> $GITHUB_OUTPUT
        fi

  full-eval:
    runs-on: ubuntu-latest
    needs: quick-eval
    if: needs.quick-eval.outputs.should-run-full == 'true'
    
    steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
      
    - name: Run full evaluation suite
      run: npx viteval run --config viteval.full.config.ts
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        
    - name: Upload detailed results
      uses: actions/upload-artifact@v4
      with:
        name: full-evaluation-results
        path: viteval-results/
```

## GitLab CI

### Basic Pipeline

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - evaluate

variables:
  NODE_VERSION: "20"

before_script:
  - npm ci

evaluate:
  stage: evaluate
  image: node:$NODE_VERSION
  script:
    - npx viteval run
  artifacts:
    reports:
      junit: viteval-results/junit.xml
    paths:
      - viteval-results/
    expire_in: 1 week
  only:
    - main
    - merge_requests
```

### Environment-Specific Evaluations

```yaml
.evaluate_template: &evaluate_template
  stage: evaluate
  image: node:$NODE_VERSION
  script:
    - npx viteval run --config $VITEVAL_CONFIG
  artifacts:
    paths:
      - viteval-results/
    expire_in: 1 week

evaluate:staging:
  <<: *evaluate_template
  variables:
    VITEVAL_CONFIG: "viteval.staging.config.ts"
    MODEL_ENDPOINT: $STAGING_MODEL_ENDPOINT
  only:
    - develop

evaluate:production:
  <<: *evaluate_template
  variables:
    VITEVAL_CONFIG: "viteval.production.config.ts"
    MODEL_ENDPOINT: $PRODUCTION_MODEL_ENDPOINT
  only:
    - main
  when: manual
```

## Configuration for CI/CD

### Environment-Specific Configs

Create different configurations for different environments:

```ts
// viteval.ci.config.ts
export default {
  // Faster execution for CI
  parallel: 4,
  timeout: 300000, // 5 minutes
  
  // Generate CI-friendly reports
  reporters: ['junit', 'json'],
  
  // Filter for CI-relevant tests
  pattern: '**/*.{eval,test}.ts',
  
  // Fail fast on errors
  failFast: true
}
```

```ts
// viteval.production.config.ts
export default {
  // Comprehensive evaluation
  parallel: 8,
  timeout: 1800000, // 30 minutes
  
  // Detailed reporting
  reporters: ['html', 'json', 'junit'],
  
  // All evaluations
  pattern: '**/*.eval.ts',
  
  // Continue on errors to get full picture
  failFast: false
}
```

### Conditional Evaluation

Use environment variables to control evaluation behavior:

```ts
// viteval.config.ts
export default {
  // Adjust based on environment
  parallel: process.env.CI ? 4 : 2,
  
  // Shorter timeout in CI
  timeout: process.env.CI ? 300000 : 600000,
  
  // Skip expensive evaluations in PR builds
  pattern: process.env.GITHUB_EVENT_NAME === 'pull_request' 
    ? '**/*.smoke.eval.ts'
    : '**/*.eval.ts'
}
```

## Quality Gates

### Threshold-Based Gating

Automatically fail builds when evaluations don't meet thresholds:

```ts
evaluate('Production quality gate', {
  data: () => criticalTestCases,
  task: async (input) => myModel.generate(input),
  scorers: [scorers.factual, scorers.answerRelevancy],
  threshold: 0.85, // Must meet 85% threshold
  
  // Fail CI if threshold not met
  onComplete: (results) => {
    if (results.score < 0.85) {
      process.exit(1)
    }
  }
})
```

### Custom Exit Codes

Use specific exit codes for different failure types:

```ts
// evaluation-runner.ts
import { runEvaluations } from 'viteval'

async function main() {
  try {
    const results = await runEvaluations()
    
    if (results.failed > 0) {
      console.error('Some evaluations failed')
      process.exit(2) // Test failures
    }
    
    if (results.averageScore < 0.8) {
      console.error('Average score below threshold')
      process.exit(3) // Performance regression
    }
    
    console.log('All evaluations passed!')
    process.exit(0)
    
  } catch (error) {
    console.error('Evaluation runner error:', error)
    process.exit(1) // System error
  }
}

main()
```

## Secrets Management

### Environment Variables

Store API keys and sensitive configuration in environment variables:

```bash
# GitHub Secrets
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
MODEL_ENDPOINT=https://api.example.com

# GitLab Variables
EVALUATION_DATABASE_URL=postgresql://...
RESULTS_WEBHOOK_URL=https://...
```

### Configuration Files

Use different configuration files for different environments:

```ts
// viteval.config.ts
const config = {
  development: {
    apiKey: process.env.DEV_API_KEY,
    endpoint: 'https://dev-api.example.com'
  },
  staging: {
    apiKey: process.env.STAGING_API_KEY,
    endpoint: 'https://staging-api.example.com'
  },
  production: {
    apiKey: process.env.PROD_API_KEY,
    endpoint: 'https://api.example.com'
  }
}

export default config[process.env.NODE_ENV || 'development']
```

## Results and Reporting

### JUnit XML Output

Generate JUnit-compatible XML for CI integration:

```ts
// viteval.config.ts
export default {
  reporters: ['junit'],
  outputDir: 'viteval-results'
}
```

### Custom Reporting

Send results to external systems:

```ts
evaluate('API Quality Check', {
  // ... evaluation config
  
  onComplete: async (results) => {
    // Send to monitoring system
    await fetch(process.env.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        commit: process.env.GITHUB_SHA,
        results
      })
    })
  }
})
```

### Trend Tracking

Store historical results for trend analysis:

```ts
// store-results.ts
import { appendFileSync } from 'fs'

export function storeResults(results: EvaluationResults) {
  const record = {
    timestamp: new Date().toISOString(),
    commit: process.env.GITHUB_SHA,
    branch: process.env.GITHUB_REF_NAME,
    score: results.averageScore,
    passed: results.passed,
    failed: results.failed
  }
  
  appendFileSync('evaluation-history.jsonl', 
    JSON.stringify(record) + '\n')
}
```

## Performance Optimization

### Caching

Cache evaluation results to speed up CI:

```yaml
# GitHub Actions caching
- name: Cache evaluation results
  uses: actions/cache@v3
  with:
    path: ~/.viteval-cache
    key: viteval-${{ hashFiles('**/*.eval.ts') }}-${{ github.sha }}
    restore-keys: |
      viteval-${{ hashFiles('**/*.eval.ts') }}-
      viteval-
```

### Parallel Execution

Optimize parallel execution for your CI environment:

```ts
// viteval.ci.config.ts
export default {
  // Match CI runner specs
  parallel: process.env.CI_RUNNER_CORES || 4,
  
  // Batch smaller datasets
  batchSize: 10,
  
  // Reasonable timeout for CI
  timeout: 300000
}
```

## Troubleshooting

### Common CI Issues

1. **Timeout errors**: Increase timeout or reduce evaluation scope
2. **API rate limits**: Implement retry logic and adjust parallelism
3. **Memory issues**: Use smaller batch sizes or stream processing
4. **Flaky tests**: Add retry logic for network-dependent evaluations

### Debug Mode

Enable debug logging in CI:

```bash
DEBUG=viteval:* npx viteval run
```

### Conditional Debugging

Only enable debug mode on failures:

```yaml
- name: Run evaluations
  run: npx viteval run
  env:
    DEBUG: ${{ failure() && 'viteval:*' || '' }}
```