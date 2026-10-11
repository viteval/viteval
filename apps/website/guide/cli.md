# CLI Usage

The Viteval CLI uses maltty for project commands and Vitest for evaluation execution.

## Commands

### Initialize a project

```bash
viteval init
viteval init --no-env-file
viteval init --env-file --env-file-path .env.local
```

Initialization preserves existing configuration. In noninteractive environments,
it creates the configuration and setup module without prompting. Pass `--env-file`
to create an environment file explicitly.

### Run Evaluations

```bash
# Run all evaluations
viteval

# Run specific files
viteval chat.eval.ts

# Run multiple path filters
viteval run chat.eval.ts summarization.eval.ts
```

Evaluation commands use Vitest's CLI directly. File arguments are path filters, not globs. Native options such as `--watch`, `--project`, `--retry`, `--testTimeout`, `--reporter`, and `--coverage` work unchanged.

### Datasets

Easily create and manage datasets for your evaluations.

```bash
# Generate datasets from dataset and eval files
viteval data

# Generate matching datasets
viteval data "src/user-questions.dataset.ts"

# Regenerate existing datasets
viteval data --overwrite

# Import datasets from a specific Vitest project
viteval data --root ./app --project evaluation
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

Generation imports these modules in the selected Vitest worker, with its setup
files and configured provider. It does not execute evaluation tasks or scorers.
Module-level code still runs on import; keep expensive calls inside dataset
generators or evaluation tasks. Native setup hooks remain active.

Aliases and re-exports of the same dataset generate it once. Distinct dataset
objects with the same name fail instead of overwriting each other. Existing
datasets are preserved unless `--overwrite` is passed. Memory datasets run their
generator without writing a persisted file. Modules that fail during import do
not publish their datasets.

### View results

```bash
viteval ui --root ./app
viteval ui --port 6274 --open
```

The UI reads datasets and evaluation results from the selected project's `.viteval`
directory. Configure the JSON reporter to save results there.

The packaged TanStack Start dashboard serves server-rendered pages and bundled
JavaScript/CSS without requiring a development server. Dashboard, results,
datasets, suites, and settings URLs support direct navigation and reloads.

### Debugging

```bash
# Show all native Vitest options
viteval run --help --expand-help

# Show Viteval project commands
viteval --help
```

### Compiled CLI

The repository can compile Viteval into an executable using maltty's Bun bundler.
See the [build instructions](https://github.com/viteval/viteval/blob/main/contributing/commands.md#compiled-cli).

The executable runs help, version, and initialization directly. Evaluation,
dataset, and UI commands use the project's installed `viteval` package through
Node >=26. Install `viteval` in the project before using those commands. The
binary preserves native Vitest arguments and exit codes.
