# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Repository Purpose

LLM evaluation framework built on Vitest. Provides tools for evaluating large language model outputs with custom scorers, datasets, and reporters.

## Quick Reference

| Task     | Command         |
| -------- | --------------- |
| Build    | `pnpm build`    |
| Test     | `pnpm test`     |
| Validate | `pnpm validate` |
| Fix lint | `pnpm fix`      |

## Structure

```
viteval/
├── packages/     # Core packages (@viteval/core, cli, ui, internal, viteval)
├── apps/         # Website (Vitepress)
├── examples/     # Example projects
├── tools/        # Nx generators
└── docs/         # Contributor documentation
```

See `docs/structure.md` for details.

## Architecture

The `viteval` package is the unified entry point. It re-exports from internal packages (`@viteval/core`, `@viteval/cli`) so users install one package.

| Package | Purpose |
| --- | --- |
| `viteval` | Main package, re-exports core + CLI |
| `@viteval/core` | Evaluation engine (evaluate, scorers, datasets) |
| `@viteval/cli` | Command-line interface |
| `@viteval/ui` | Web UI for viewing results |
| `@viteval/internal` | Shared utilities (internal only) |

See `docs/architecture.md` for details.

## Documentation Index

| When you need to... | Read |
| --- | --- |
| Understand repo layout | `docs/structure.md` |
| Understand architecture | `docs/architecture.md` |
| Write code patterns | `docs/patterns.md` |
| Write tests | `docs/testing.md` |
| Use dev commands | `docs/commands.md` |
| Write documentation | `docs/documentation.md` |

## Guides

Step-by-step instructions in `docs/guides/`:

| Guide | Purpose |
| --- | --- |
| `setup-local-env.md` | Get started developing |
| `configure-ide.md` | Set up VS Code |
| `configure-ai-coding.md` | Set up Claude Code |
| `add-package.md` | Create new packages |
| `add-feature.md` | Add functionality |
| `add-example.md` | Create examples |
| `add-test.md` | Write tests |
| `add-mock.md` | Mock dependencies |
| `commit-changes.md` | Validate and commit |
| `publish-changes.md` | Create changesets |

## Development

### Commands

```bash
pnpm build           # Build all packages
pnpm dev             # Development mode with watch
pnpm test            # Run all tests
pnpm types           # TypeScript type checking
pnpm check           # Run lint and format checks
pnpm fix             # Auto-fix linting and formatting
pnpm validate        # Run check, types, test, build (CI mode)
```

### Code Quality

- Run `pnpm validate` before committing
- Tests co-located with source: `*.test.ts`
- Prefer functional programming
- Add JSDoc with examples for public APIs

### Testing

- Use Vitest (`describe`, `it`, `expect`)
- BDD style preferred
- Co-locate tests: `feature.ts` → `feature.test.ts`
- Import test utilities: `import { describe, it, expect } from 'vitest'`

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description |
| --- | --- |
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `refactor` | Code change (no feature/fix) |
| `test` | Adding tests |
| `chore` | Maintenance |

## Tool Usage

Prefer Serena MCP tools over native or Bash equivalents for code operations.

| Task | Serena Tool | Bash Equivalent |
| --- | --- | --- |
| List directory | `list_dir` | `ls` |
| Find files | `find_file` | `find`, `fd` |
| Search content | `search_for_pattern` | `grep`, `rg` |
| Get file overview | `get_symbols_overview` | — |
| Find symbol | `find_symbol` | `grep` (less precise) |
| Find usages | `find_referencing_symbols` | `grep` (less precise) |
| Edit symbol | `replace_symbol_body` | `sed` |
| Insert code | `insert_after_symbol`, `insert_before_symbol` | `sed` |
| Rename symbol | `rename_symbol` | — |

**Why Serena?**
- LSP-powered semantic understanding
- Aware of symbol boundaries (functions, classes, methods)
- Safer edits that respect code structure

**When to use Bash:**
- Non-code files (config, markdown)
- Git operations
- Running scripts and commands

## Tech Stack

- **Runtime:** Node.js >= 22.0.0
- **Package Manager:** pnpm >= 10.0.0
- **Language:** TypeScript (~5.9)
- **Build Tool:** tsdown
- **Test Framework:** Vitest (4.x)
- **Monorepo Tool:** Nx (22.x)
- **Linting:** oxlint
- **Formatting:** oxfmt
- **Versioning:** Changesets
