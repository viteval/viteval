<p align="center">
<a href="https://viteval.dev">
<img src="./.github/assets/viteval-icon.png" height="200">
</a>
</p>

<h1 align="center">
Viteval
</h1>
<p align="center">
Next generation LLM evaluation framework powered by Vitest.
<p>
<p align="center">
  <a href="https://www.npmjs.com/package/viteval"><img src="https://img.shields.io/npm/v/viteval?color=BE54F5&label="></a>
<p>

<p align="center">
 <a href="https://viteval.dev">Documentation</a> | <a href="https://viteval.dev/guide/getting-started ">Getting Started</a> | <a href="https://viteval.dev/examples">Examples</a>
</p>
<br>
<br>

> [!WARNING]
> This branch is under active development for **v1**. Expect breaking changes.
> For the latest stable release (v0), see the [`v0` branch](https://github.com/viteval/viteval/tree/v0).

## Features

- Native Vitest configuration, execution, watch mode, retries, and CI exit codes.
- Typed tasks, reusable datasets, built-in scorers, and custom scoring functions.
- JSON storage by default, with atomic writes and a local results dashboard.
- TanStack Start dashboard with server-rendered pages and bundled Vite assets.
- Optional SQLite, Braintrust, Langfuse, and hosted VoltOps providers for datasets and evaluation results, plus S3/GCS dataset storage. Backend SDKs and database drivers are opt-in.
- Maltty project commands and an optional compiled command shell.

## Installation

```bash
pnpm add -D viteval
pnpm exec viteval init --no-env-file
pnpm exec viteval run
pnpm exec viteval ui
```

Requires Node >=26. Initialization creates native Vitest configuration, a worker
setup module, and a passing `src/viteval.eval.ts` example. JSON results are saved
under `.viteval/results`.

## Usage

You can use `viteval` to evaluate your LLM and add tests in your CI in one single file.

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

Now you can run the eval by running:

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
```

The consumer check installs packed packages outside the workspace and verifies
initialization, evaluations, JSON datasets, SQLite, server-rendered dashboard
deep links, JavaScript/CSS delivery, and API/404 behavior. Run
`pnpm dev:ui examples/basic` to develop the dashboard with Vite on port 6274.
See [v1 completion](./contributing/v1.md) for the release contract and evidence.
