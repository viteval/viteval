# Migrate to v1

V1 requires Node >=26. Vitest 5 runs evaluations internally; Viteval owns configuration.

## Configuration

Use `viteval.config.ts` and move evaluation settings into `eval`:

```ts
import { defineConfig } from 'viteval/config';

export default defineConfig({
  eval: {
    include: ['src/**/*.eval.ts'],
    timeout: 100_000,
    results: ['json'],
  },
});
```

Register raw AI SDK providers under `models.providers` and storage integrations
under `providers`. Select judge/embedding defaults with `models.defaults` using
`provider:model-id` strings. No setup file or initialization call is required.

For earlier release candidates, replace `test.testTimeout`, `test.maxConcurrency`,
and `test.retry` with `eval.timeout`, `eval.concurrency`, and `eval.retries`.
Replace evaluation `testOptions` with direct `timeout`, `concurrency`, `retries`,
and `skip` options. See [Configuration](/api/configuration).

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

V1 uses separate `tags` and `taggings` tables. It does not import pre-V1
`eval_runs.tags` values. Back up earlier databases and export tag associations
before upgrading, then reapply them through the V1 tag provider.

Reports carry `schemaVersion: 1`, run identity, final evaluation case state, and
execution diagnostics. Only V1 files are supported; the dashboard reports
malformed or incompatible files as warnings.
The JSON provider preserves run history under `.viteval/results` without a
separate output filename or reporter.

## CLI

`viteval run` owns its options and file filters. Use `viteval run --help` for
evaluation options and `viteval --help` for project commands. Replace native
runner flags with `--timeout`, `--concurrency`, `--retries`, and `--name`.
For init, data, and UI commands, `--cwd` selects the working directory.

Replace output-path/reporter configuration with `eval.results: ['json']`.
Destination arrays replace inherited selections; `[]` disables persistence.
Dataset generation destinations use `dataset.providers` or per-definition
`providers`. Evaluations select existing read sources independently through
callbacks such as `data: ({ langfuse }) => langfuse.dataset('support')`.

`viteval data` now scans dataset and eval modules. Default exports, named exports,
and inline `defineDataset()` calls are supported; generation skips evaluation
tasks and scorers. See [CLI datasets](./cli#datasets).

## Dashboard

Use `viteval ui` to inspect V1 results and datasets. Pre-V1 files are not read
through compatibility fallbacks. The `createVitevalServer()` launcher API is
available for programmatic integrations.
