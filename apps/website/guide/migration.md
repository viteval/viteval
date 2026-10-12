# Migrate to v1

V1 requires Node >=26 and uses native Vitest 5 configuration.

## Configuration

Replace the old `viteval.config.ts` configuration layer with `vitest.config.ts`.
Move evaluation settings into Vitest's `test` object:

```ts
import { defineConfig } from 'viteval/config';
import { JsonReporter } from 'viteval/reporters';

export default defineConfig({
  test: {
    include: ['src/**/*.eval.ts'],
    setupFiles: ['./viteval.setup.ts'],
    testTimeout: 100_000,
    reporters: [
      'default',
      new JsonReporter({
        outputFile: '.viteval/results/<id>.json',
      }),
    ],
  },
});
```

Model/provider objects initialize in worker setup modules. V1 does not use a
custom runner, plugin, or task-metadata transport. Evaluation results are Vitest
custom artifacts.

Evaluations remain native Vitest suites and cases. A Viteval task marker and
typed `viteval:eval-result` artifacts identify evaluation results, so reporters
do not need a custom task collector or result-shape guessing. Native retries,
hooks, reporters, and exit status remain authoritative.

## Tasks and scorers

Tasks receive an object: `task: ({ input, context }) => ...`. Expected answers
are supplied to scorers, not to the task. Construct built-in scorers with factory
calls such as `scorers.exactMatch()` and `scorers.levenshtein()`.

Custom scorers return `{ score, metadata? }`. Task output can have a different
type from the dataset's expected value.

Thresholds apply per case to the selected `mean`, `median`, or `sum`. Null scores
count as zero. Empty datasets, empty scorer lists, non-finite thresholds/scores,
and unsupported JSON values fail explicitly.

## Storage and reports

JSON is the default provider. Explicitly use `viteval({ database: 'sqlite' })`
for the optional database provider. See [Providers](./providers).

Reports carry `schemaVersion: 1`, run identity, final Vitest case state, and
execution diagnostics. The dashboard accepts legacy files that match the
supported structure and reports malformed or incompatible files as warnings.
Use `<id>` or `<run>` in the output filename to preserve watch-run history.
An explicit static output filename is overwritten on each run.

## CLI

`viteval run` delegates evaluation flags and file filters to Vitest. Use
`viteval run --help --expand-help` for native options and `viteval --help` for
project commands. Init, data, and UI commands now use maltty; `--cwd` selects
the working directory.

Replace the old output-path option with
`new JsonReporter({ outputFile: '.viteval/results/latest.json' })` in the native
config. Omitting `outputFile` writes the completed evaluation JSON to stdout.

`viteval data` now scans dataset and eval modules. Default exports, named exports,
and inline `defineDataset()` calls are supported; generation skips evaluation
tasks and scorers. See [CLI datasets](./cli#datasets).

## Dashboard

The UI now uses TanStack Start and TanStack Router with Vite builds instead of
Next.js. Continue using `viteval ui`; result/dataset files and existing dashboard
URLs do not need conversion. The published package includes both browser assets
and the server bundle. The `createVitevalServer()` launcher API is preserved.

For repository development, use `pnpm dev:ui examples/basic` on port 6274.
Production output lives under `packages/ui/dist/client` and
`packages/ui/dist/server`; Next.js standalone output is no longer used.
