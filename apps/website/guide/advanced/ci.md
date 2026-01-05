# CI Integration

Learn how to integrate Viteval into your continuous integration and deployment pipelines to ensure consistent LLM performance.

## Overview

Viteval is designed to work seamlessly in CI/CD environments, allowing you to:

- Run evaluations automatically on code changes
- Gate deployments based on evaluation results
- Track performance regressions over time
- Generate evaluation reports

## GitHub Actions

You can use Viteval in your GitHub Actions workflows to run evaluations on code changes. 

::: tip

We highly recommend restricting `paths` to only the files that changed (so you don't run evals on non-impactful changes).

:::

Here's an example workflow:

```yaml
name: LLM Evaluation

on:
  push:
    branches: [ main, develop ]
    # HIGHLY recommend restricting paths to only the files that changed (so you don't run evals on non-impactful changes)
    paths:
      - apps/api/src/ai/**/*.ts
      - apps/api/src/lib/ai/**/*.ts
  pull_request:
    branches: [ main ]
    # HIGHLY recommend restricting paths to only the files that changed (so you don't run evals on non-impactful changes)
    paths:
      - apps/api/src/ai/**/*.ts
      - apps/api/src/lib/ai/**/*.ts
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
        ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## GitLab CI/CD

Coming soon!

## CircleCI 

Coming soon!
