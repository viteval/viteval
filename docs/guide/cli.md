# CLI usage

Use the CLI to initialize projects, run evaluations, generate datasets, and open
the dashboard. Viteval owns its commands and options; the execution engine is internal.

## Commands

### Initialize a project

```bash
viteval init
viteval init --no-env-file
viteval init --create-env-file --env-file-path .env.local
```

Initialization preserves existing configuration. In noninteractive environments,
it creates the configuration without prompting. Pass `--env-file`
to create an environment file explicitly.

Use its `--create-env-file` alias when selecting a custom path to avoid Node's
runtime `--env-file` option. Absolute and relative paths target the same file
when created and loaded by the generated config.

Init writes `viteval.config.ts` for ESM projects and `viteval.config.mts` for
CommonJS projects, so the generated configuration can import the ESM-only Viteval
entry points. Existing Viteval configuration files in either format are preserved.
Relative `--config` paths resolve against `--root` when supplied.

### Run evaluations

```bash
# Run all evaluations
viteval

# Run specific files
viteval chat.eval.ts

# Run multiple path filters
viteval run chat.eval.ts summarization.eval.ts
```

File arguments are path filters, not globs. Use `--watch` for continuous evaluation,
`--name` to filter names, and `--timeout`, `--concurrency`, or `--retries` to override
project defaults. `--coverage` enables code coverage.

List evaluations without running their tasks or scorers:

```bash
viteval list
viteval list --json
```

Collection still imports evaluation modules. Keep paid calls inside evaluation
tasks or scorers, not at module scope.

Timeout, retry, and concurrency settings resolve in this order: per-evaluation
options, CLI flags, project `eval` defaults, framework defaults. `--root` overrides
the configured project root for both discovery and saved results.

### Datasets

Generate saved datasets from TypeScript modules:

```bash
# Generate datasets from dataset and eval files
viteval data

# Generate matching datasets
viteval data "src/user-questions.dataset.ts"

# Regenerate existing datasets
viteval data --overwrite

# Generate datasets with a selected Viteval configuration
viteval data --root ./app --config viteval.config.ts
```

The default pattern is `**/*.{dataset,eval}.{js,ts,mts,mjs}`. Dataset modules can
use default exports, named exports, or multiple `defineDataset()` calls. Datasets
defined inside eval files are discovered even when they are not exported.

```ts
// src/questions.eval.ts
import { evaluate, scorers } from 'viteval';
import { defineDataset } from 'viteval/dataset';

const questions = defineDataset({
  name: 'questions',
  data: async () => [{ input: 'hello', expected: 'HELLO' }],
});

evaluate('uppercase', {
  data: questions,
  task: ({ input }) => input.toUpperCase(),
  scorers: [scorers.exactMatch()],
});
```

Generation imports these modules in a worker with the selected Viteval config
and registered providers. It does not execute evaluation tasks or scorers.
Module-level code still runs on import; keep expensive calls inside dataset
generators or evaluation tasks.

Aliases and re-exports of the same dataset generate it once. Distinct dataset
objects with the same name fail instead of overwriting each other. Existing
datasets are preserved unless `--overwrite` is passed. Datasets with `providers: []` run their
generator without writing a persisted file. Modules that fail during import do
not publish their datasets.

### View results

```bash
viteval ui --root ./app
viteval ui --port 6274 --open
```

The UI reads datasets and evaluation results from the selected project's `.viteval`
directory. Select `eval.results: ['json']` to save results there.

The installed package includes the dashboard server and browser assets; you do
not need a development server. You can open or reload dashboard, results,
datasets, suites, and settings URLs directly.

### Debugging

```bash
# Show evaluation options
viteval run --help

# Show Viteval project commands
viteval --help
```

### Compiled CLI

The repository can compile Viteval into an executable using maltty's Bun bundler.
See the [build instructions](https://github.com/viteval/viteval/blob/main/contributing/commands.md#compiled-cli).

The executable runs help, version, and initialization directly. Evaluation,
dataset, and UI commands use the project's installed `viteval` package through
Node >=26. Install `viteval` in the project before using those commands. The
binary uses the same Viteval options and exit codes.
