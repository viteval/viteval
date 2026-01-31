# CLI Commands

Complete reference for all Viteval CLI commands and options.

## Overview

Viteval provides four main commands: `run`, `init`, `data`, and `ui`. Each command has specific options for controlling behavior.

---

## viteval run

Run LLM evaluations against your task functions.

### Syntax

```bash
viteval run [pattern] [options]
```

### Arguments

| Argument  | Type   | Description                      |
| --------- | ------ | -------------------------------- |
| `pattern` | string | Glob pattern to match eval files |

### Options

| Option        | Alias | Type     | Default   | Description                    |
| ------------- | ----- | -------- | --------- | ------------------------------ |
| `--reporters` | `-r`  | string[] | `default` | Reporters to use for output    |
| `--ui`        | `-u`  | boolean  | `false`   | Start UI server after running  |
| `--root`      | -     | string   | `.`       | Root directory for evaluations |
| `--config`    | `-c`  | string   | auto      | Path to config file            |

### Reporter Options

| Reporter  | Description                                        |
| --------- | -------------------------------------------------- |
| `default` | Console output with pass/fail summary              |
| `json`    | JSON output to stdout                              |
| `file`    | JSON output to `.viteval/results/<timestamp>.json` |

### Examples

```bash
# Run all evaluations
viteval run

# Run evaluations matching a pattern
viteval run "src/**/*.eval.ts"

# Run with JSON reporter
viteval run -r json

# Run with multiple reporters
viteval run -r default -r file

# Run and open UI
viteval run --ui

# Run from a specific directory
viteval run --root ./packages/my-package

# Run with a specific config file
viteval run --config ./custom.config.ts
```

### Output Example

```
 ✓ src/model.eval.ts (3 tests) 1250ms
   ✓ A test eval
     ✓ Generate a random number between 0 and 100 850ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  10:30:00
   Duration  1.25s
```

---

## viteval init

Initialize a new Viteval project with configuration files.

### Syntax

```bash
viteval init [options]
```

### Options

| Option            | Type    | Default | Description        |
| ----------------- | ------- | ------- | ------------------ |
| `--env-file`      | boolean | prompt  | Create .env file   |
| `--env-file-path` | string  | `.env`  | Path for .env file |

### Generated Files

| File                | Description                        |
| ------------------- | ---------------------------------- |
| `viteval.config.ts` | Main configuration file            |
| `viteval.setup.ts`  | Setup file for environment loading |
| `.env`              | Environment variables (if enabled) |
| `.viteval/`         | Directory for datasets and results |

### Examples

```bash
# Initialize with prompts
viteval init

# Initialize with .env file
viteval init --env-file

# Initialize without .env file
viteval init --env-file=false

# Initialize with custom .env path
viteval init --env-file --env-file-path=.env.local
```

### Generated viteval.config.ts

```ts
import { defineConfig } from 'viteval/config';

export default defineConfig({
  eval: {
    include: ['**/*.eval.ts'],
    setupFiles: ['./viteval.setup.ts'],
  },
});
```

### Generated viteval.setup.ts

```ts
import { config } from 'dotenv';

config();
```

---

## viteval data

Generate and save datasets from dataset definition files.

### Syntax

```bash
viteval data [pattern] [options]
```

### Arguments

| Argument  | Type   | Default                        | Description                    |
| --------- | ------ | ------------------------------ | ------------------------------ |
| `pattern` | string | `**/*.dataset.{js,ts,mts,mjs}` | Glob pattern for dataset files |

### Options

| Option        | Alias | Type    | Default | Description                  |
| ------------- | ----- | ------- | ------- | ---------------------------- |
| `--overwrite` | -     | boolean | `false` | Overwrite existing datasets  |
| `--verbose`   | `-V`  | boolean | `false` | Show detailed error messages |

### Storage Location

Datasets are saved to `.viteval/datasets/<name>.json` where `<name>` is the dataset name defined in `defineDataset`.

### Examples

```bash
# Generate all datasets
viteval data

# Generate datasets matching a pattern
viteval data "src/**/*.dataset.ts"

# Overwrite existing datasets
viteval data --overwrite

# Generate with verbose error output
viteval data --verbose
```

### Dataset File Example

```ts
// src/questions.dataset.ts
import { defineDataset } from 'viteval/dataset';

export default defineDataset({
  name: 'questions',
  data: async () => {
    // Generate or fetch data
    return [
      { input: 'What is 2+2?', expected: '4' },
      { input: 'What is the capital of France?', expected: 'Paris' },
    ];
  },
});
```

### Output Example

```
Generating datasets  [========================================] 2/2

Skipped 0 datasets as they already exist
Generated 2 datasets
```

---

## viteval ui

Start the UI server to view evaluation results.

### Syntax

```bash
viteval ui [options]
```

### Options

| Option    | Alias | Type    | Default | Description                |
| --------- | ----- | ------- | ------- | -------------------------- |
| `--port`  | `-p`  | number  | auto    | Port for the UI server     |
| `--open`  | `-o`  | boolean | `false` | Open browser automatically |
| `--debug` | `-d`  | boolean | `false` | Enable debug mode          |

### Examples

```bash
# Start UI server
viteval ui

# Start on specific port
viteval ui --port 3000

# Start and open browser
viteval ui --open

# Start in debug mode
viteval ui --debug
```

### Viewing Results

The UI reads results from `.viteval/results/` directory. Run evaluations with the `file` reporter to generate viewable results:

```bash
# Generate results for UI
viteval run -r file

# Then view in UI
viteval ui --open
```

---

## Environment Variables

| Variable             | Description                    |
| -------------------- | ------------------------------ |
| `VITEVAL_DEBUG_MODE` | Enable debug output (`true`)   |
| `OPENAI_API_KEY`     | OpenAI API key for LLM scorers |

### Example .env

```bash
OPENAI_API_KEY="sk-..."
VITEVAL_DEBUG_MODE="false"
```

---

## Exit Codes

| Code | Description                                    |
| ---- | ---------------------------------------------- |
| `0`  | Success - all evaluations passed               |
| `1`  | Failure - evaluations failed or error occurred |

---

## Configuration File

Commands read from `viteval.config.ts` by default. Override with `--config`.

```ts
import { defineConfig } from 'viteval/config';

export default defineConfig({
  // Reporters for output
  reporters: ['default', 'file'],

  // Evaluation settings
  eval: {
    include: ['src/**/*.eval.ts'],
    exclude: ['**/*.skip.eval.ts'],
    setupFiles: ['./viteval.setup.ts'],
    timeout: 30000,
  },

  // OpenAI provider config (for LLM scorers)
  provider: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  },
});
```

## References

- [CLI Overview](./overview.md) - Introduction to CLI
- [Core API](../api/core.md) - `defineConfig` options
- [Reporters API](../api/reporters.md) - Reporter configuration
- [Datasets API](../api/datasets.md) - Dataset definition
