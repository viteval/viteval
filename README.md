<p align="center">
<a href="https://viteval.dev">
<img src="./public/assets/viteval-flask.svg" alt="Viteval flask" height="160">
</a>
</p>

<h1 align="center">
Viteval
</h1>
<p align="center">
TypeScript-native evals, powered by Vitest.
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/viteval"><img alt="Viteval release candidate" src="https://img.shields.io/npm/v/viteval/rc?color=168DFA&label="></a>
</p>

<p align="center">
  <a href="https://viteval.dev">Documentation</a> | <a href="https://viteval.dev/guide/getting-started">Getting started</a> | <a href="https://viteval.dev/examples">Examples</a> | <a href="https://viteval.dev/brand">Brand & assets</a>
</p>
<br>
<br>

> [!WARNING]
> V1 is a release candidate. Install `viteval@rc`; untagged installs resolve to v0.
> V0 support ends when v1 launches. The [`v0` branch](https://github.com/viteval/viteval/tree/v0) contains the stable release.

## Features

- Viteval configuration with Vitest execution, watch mode, retries, and CI exit codes.
- Typed tasks, reusable datasets, built-in scorers, and custom scoring functions.
- JSON storage by default, with atomic writes. Inspect saved results locally with `viteval ui`.
- Optional SQLite, Braintrust, Langfuse, and hosted VoltOps providers for datasets and evaluation results, plus S3/GCS dataset storage. Backend SDKs and database drivers are opt-in.
- CLI commands for project setup, dataset generation, and the dashboard.

## Installation

```bash
pnpm add -D viteval@rc
pnpm exec viteval init --no-env-file
pnpm exec viteval run
pnpm exec viteval ui
```

Requires Node >=26. Initialization creates `viteval.config.ts` and a passing
`src/viteval.eval.ts` example. No worker setup is required. JSON results are saved
under `.viteval/results`.

## Usage

Define an evaluation in `src/uppercase.eval.ts`. This example runs without a model or API key:

```ts
import { evaluate, scorers } from 'viteval';

evaluate('Uppercase', {
  data: [
    { input: 'hello', expected: 'HELLO' },
    { input: 'world', expected: 'WORLD' },
  ],
  task: ({ input }) => input.toUpperCase(),
  scorers: [scorers.exactMatch()],
});
```

Run it locally or in CI:

```bash
pnpm exec viteval run
```

Replace `task` with your model, agent, or workflow. Each case passes when its
configured mean, median, or sum meets the threshold. Failed execution and scorer
errors fail the case and remain inspectable in the JSON report.

## Development

```bash
pnpm validate
pnpm validate:consumer
pnpm --filter @viteval/cli test:binary
pnpm docs:types
pnpm docs:build
```

The consumer check installs packed packages outside the workspace and verifies
initialization, evaluations, JSON datasets, SQLite, server-rendered dashboard
deep links, JavaScript/CSS delivery, and API/404 behavior. Run
`pnpm dev:ui examples/basic` to develop the dashboard with Vite on port 6274.
See [v1 completion](./contributing/v1.md) for the release contract and evidence.
