---
title: data
description: Generate datasets from dataset or evaluation modules using Viteval configuration.
---

# `data`

Discover named datasets and run their generators using the selected Viteval
configuration and selected destination providers. Evaluation tasks and scorers do
not run during generation.

## Usage

```bash
viteval data [pattern] [options]
```

## Arguments

| Argument  | Default                               | Description                                         |
| --------- | ------------------------------------- | --------------------------------------------------- |
| `pattern` | `**/*.{dataset,eval}.{js,ts,mts,mjs}` | Glob pattern matching dataset or evaluation modules |

Quote patterns to prevent your shell from expanding them before Viteval runs.

## Options

| Option                  | Default           | Description                              |
| ----------------------- | ----------------- | ---------------------------------------- |
| `--overwrite`           | `false`           | Regenerate and replace existing datasets |
| `--root <path>`         | Current directory | Select the project root                  |
| `--config <path>`, `-c` | Viteval discovery | Select a Viteval configuration file      |
| `--verbose`, `-V`       | `false`           | Enable verbose output                    |

## Discovery and persistence

Modules can use default exports, named exports, or multiple `defineDataset()`
calls. Datasets inside evaluation files are discovered even when not exported.
Aliases and re-exports of the same dataset generate it once. Distinct dataset
objects with the same name fail instead of overwriting each other.

Existing datasets are preserved unless `--overwrite` is passed. Datasets with `providers: []`
run their generators without writing persisted files. Modules that fail during
import do not publish their datasets.

Module-level code still runs on import. Keep expensive calls inside dataset
generators or evaluation tasks.

## Examples

```bash
viteval data
viteval data "src/user-questions.dataset.ts"
viteval data --overwrite
viteval data --root ./app --config viteval.config.ts
```

## References

- [Datasets](/concepts/datasets) for storage modes
- [`defineDataset()`](/api/define-dataset) for the generator API
