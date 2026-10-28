---
title: init
description: Initialize Viteval configuration and a passing evaluation example.
---

# `init`

Create a Viteval setup in the current project. Requires a `package.json`.
Existing files and Viteval configuration are preserved.

## Usage

```bash
viteval init [options]
```

## Options

| Option                            | Default                                 | Description                                               |
| --------------------------------- | --------------------------------------- | --------------------------------------------------------- |
| `--env-file`, `--create-env-file` | Prompt in a terminal, otherwise `false` | Create an environment file and load it in generated setup |
| `--no-env-file`                   | —                                       | Skip environment-file creation without prompting          |
| `--env-file-path <path>`          | `.env`                                  | Environment-file path, used when creation is enabled      |

Prefer the `--create-env-file` alias with a custom path to avoid Node's runtime
`--env-file` option. Absolute and relative paths target the same file when created
and loaded by the generated config module.

## Generated files

| File                  | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| `viteval.config.ts`   | Viteval configuration for ESM projects                        |
| `viteval.config.mts`  | Viteval configuration for CommonJS projects, instead of `.ts` |
| `src/viteval.eval.ts` | A passing deterministic evaluation example                    |

JSON storage and optional environment loading live in the generated config.
No Vitest config, setup module, or reporter is required. In noninteractive
environments, the command creates configuration without an env-file prompt.

## Examples

```bash
viteval init
viteval init --no-env-file
viteval init --create-env-file --env-file-path .env.local
```

## References

- [Getting started](/getting-started) for installation and the first run
- [Configuration](/api/configuration) for generated settings
