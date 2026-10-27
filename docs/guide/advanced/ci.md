# CI integration

Run `viteval run` in CI to check prompt and application changes against your
evaluation suite. A failed case returns a nonzero exit code.

## Overview

Run evaluations on pushes or pull requests and use the result as a deployment
check. Save JSON reports so you can compare runs later.

## GitHub Actions

The example below runs evaluations when the selected source paths change.

:::tip

Use `paths` to limit model requests on unrelated changes. Include evaluation
files, datasets, configuration, and dependencies as well as the code under test.
Omit the filter if you want evaluations to run on every change.

:::

Adapt the paths to your repository:

```yaml
name: LLM Evaluation

on:
  push:
    branches: [main, develop]
    # Include every path that can affect evaluation results.
    paths:
      - 'src/**'
      - 'evals/**'
      - 'datasets/**'
      - '**/*.eval.ts'
      - '**/*.dataset.ts'
      - 'viteval.config.*'
      - 'package.json'
      - 'package-lock.json'
      - '.github/workflows/evaluate.yml'
  pull_request:
    branches: [main]
    # Keep this filter in sync with the push filter.
    paths:
      - 'src/**'
      - 'evals/**'
      - 'datasets/**'
      - '**/*.eval.ts'
      - '**/*.dataset.ts'
      - 'viteval.config.*'
      - 'package.json'
      - 'package-lock.json'
      - '.github/workflows/evaluate.yml'
jobs:
  evaluate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v7

      - name: Setup Node.js
        uses: actions/setup-node@v7
        with:
          node-version: '26'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run evaluations
        run: npx viteval run
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Preserve reports

Select `eval.results: ['json']` in config, then upload the
files even when a score or execution failure makes the evaluation step fail:

```yaml
- name: Upload evaluation reports
  if: always()
  uses: actions/upload-artifact@v7
  with:
    name: evaluation-results
    path: .viteval/results/*.json
    if-no-files-found: warn
```

The same `viteval run` command works in GitLab, CircleCI, and other CI systems.
Install with a lockfile, provide model credentials through the CI environment,
and retain the JSON reports. A nonzero Vitest exit code fails the job.
