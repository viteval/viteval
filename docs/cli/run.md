---
title: run
description: Run evaluations with Viteval configuration, file filters, and execution options.
---

# `run`

Run tasks and scorers with `viteval.config.ts`. Vitest is the internal execution
engine, not a public configuration or CLI passthrough.

## Usage

```bash
viteval run [filters...] [options]
viteval [filters...] [options]
```

Both forms run once. Use `viteval run --watch` for continuous evaluation.

## Arguments

| Argument     | Description                                           |
| ------------ | ----------------------------------------------------- |
| `filters...` | File path filters passed to Vitest, not glob patterns |

## Options

Viteval owns the option schema. Per-evaluation options override CLI flags, which
override project defaults. Unknown options fail rather than forwarding to Vitest.

| Option                  | Purpose                             |
| ----------------------- | ----------------------------------- |
| `--watch`               | Rerun evaluations when files change |
| `--name <pattern>`      | Filter evaluation names             |
| `--retries <count>`     | Retry failed cases                  |
| `--timeout <ms>`        | Set the per-case timeout            |
| `--concurrency <count>` | Limit concurrent cases              |
| `--root <path>`         | Select the project root             |
| `--config <path>`       | Select a Viteval configuration file |
| `--coverage`            | Collect code coverage               |

Display the complete option reference:

```bash
viteval run --help
```

## Examples

```bash
viteval run
viteval run chat.eval.ts summarization.eval.ts
viteval --watch
viteval run --timeout 60000 --retries 2
viteval list
viteval list --json
```

A failed case or persistence failure produces a nonzero exit code. Select
`eval.results: ['json']` to save evaluation details. Listing imports modules but
does not execute generators, tasks, or scorers. See [run in CI](/guide/ci) and
[inspect results](/guide/results).

## Compiled executable

The repository can compile Viteval into an executable using maltty's Bun bundler.
See the [build instructions](https://github.com/viteval/viteval/blob/main/contributing/commands.md#compiled-cli).

The executable handles help, version, and initialization directly. Evaluation,
dataset, and UI commands use the project's installed `viteval` package through
Node >=26. Install `viteval` in the project before using those commands.

For all project commands, use `viteval --help`.
