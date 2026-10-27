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

Legacy database run tags are a breaking storage change: v1 uses separate `tags`
and `taggings` tables and does not automatically copy `eval_runs.tags` values.
Back up the database and export those tag associations before upgrading, then
reapply them through the v1 tag provider. Initialization does not drop the legacy
column, but the v1 provider does not expose its values. PostgreSQL remains experimental.

Reports carry `schemaVersion: 1`, run identity, final Vitest case state, and
execution diagnostics. The dashboard accepts legacy files that match the
supported structure and reports malformed or incompatible files as warnings.
The JSON provider preserves run history under `.viteval/results` without a
separate output filename or reporter.

## CLI

`viteval run` delegates evaluation flags and file filters to Vitest. Use
`viteval run --help --expand-help` for native options and `viteval --help` for
project commands. For init, data, and UI commands, `--cwd` selects the working
directory.

Replace output-path/reporter configuration with `eval.results: ['json']`.
Destination arrays replace inherited selections; `[]` disables persistence.
Dataset generation destinations use `dataset.providers` or per-definition
`providers`. Evaluations select existing read sources independently through
callbacks such as `data: ({ langfuse }) => langfuse.dataset('support')`.

`viteval data` now scans dataset and eval modules. Default exports, named exports,
and inline `defineDataset()` calls are supported; generation skips evaluation
tasks and scorers. See [CLI datasets](./cli#datasets).

## Dashboard

Continue using `viteval ui`; result/dataset files and existing dashboard URLs
do not need conversion. The `createVitevalServer()` launcher API is preserved.
