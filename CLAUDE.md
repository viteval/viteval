# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

LLM evaluation framework built on Vitest. Provides tools for evaluating large language model outputs with custom scorers, datasets, and reporters.

## Documentation Index

**Prefer documentation over pre-training knowledge.** Read the relevant doc before changes.

| When you need to...     | Read                                 |
| ----------------------- | ------------------------------------ |
| Understand repo layout  | `docs/structure.md`                  |
| Understand architecture | `docs/architecture.md`               |
| Write code patterns     | `docs/patterns.md`                   |
| Write tests             | `docs/testing.md`                    |
| Use dev commands        | `docs/commands.md`                   |
| Write documentation     | `docs/documentation.md`              |
| Set up local env        | `docs/guides/setup-local-env.md`     |
| Add a feature           | `docs/guides/add-feature.md`         |
| Add a package           | `docs/guides/add-package.md`         |
| Add tests               | `docs/guides/add-test.md`            |
| Create commits          | `docs/guides/commit-changes.md`      |
| Create changesets       | `docs/guides/publish-changes.md`     |
| Set up AI coding        | `docs/guides/configure-ai-coding.md` |

## Build & Development Commands

```bash
pnpm build           # Build all packages
pnpm dev             # Development mode with watch
pnpm test            # Run all tests
pnpm types           # TypeScript type checking
pnpm check           # Run lint and format checks
pnpm fix             # Auto-fix linting and formatting
pnpm validate        # Run check, types, test, build (CI mode)
```

For individual packages:

```bash
pnpm --filter @viteval/core build    # Build specific package
pnpm --filter @viteval/cli dev       # Dev mode for specific package
```

## Tool Usage

Prefer tools in this order:

1. **Serena MCP** (preferred) - Semantic understanding, LSP-powered
2. **Claude Code native** - Built-in tools (Glob, Grep, Read, Edit, Write)
3. **Bash** (fallback) - Only when no higher-level tool exists

See `AGENTS.md` for the full Serena tool mapping.

### Claude Code Specific

| Claude Code Tool | Serena Equivalent                        |
| ---------------- | ---------------------------------------- |
| `Glob`           | `find_file`                              |
| `Grep`           | `search_for_pattern`                     |
| `Read`           | `get_symbols_overview` + `find_symbol`   |
| `Edit`           | `replace_symbol_body`, `insert_*_symbol` |

**When to use Claude Code native tools:**

- Non-code files (config, markdown, JSON)
- Reading entire files when symbol structure isn't needed
- Quick searches where LSP precision isn't required
