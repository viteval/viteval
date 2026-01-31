# Viteval Project Overview

## Purpose

Viteval is an LLM evaluation framework built on Vitest. It provides tools for evaluating large language model outputs with custom scorers and datasets.

## Tech Stack

- **Runtime:** Node.js >= 22.0.0
- **Package Manager:** pnpm >= 10.0.0
- **Language:** TypeScript (~5.9)
- **Build Tool:** tsdown (0.19.x)
- **Test Framework:** Vitest (4.x)
- **Monorepo Tool:** Nx (22.x)
- **Linting:** oxlint (1.2.x)
- **Formatting:** oxfmt (0.27.x)
- **Versioning:** Changesets

## Architecture

The `viteval` package is the main entry point for users. Internal packages:

- `@viteval/core` - Evaluation engine (evaluate, scorers, datasets)
- `@viteval/cli` - Command-line interface
- `@viteval/ui` - Web UI for results
- `@viteval/internal` - Shared utilities (internal use only)

## Repository Structure

```
viteval/
├── packages/       # Core packages (@viteval/core, cli, ui, internal, viteval)
├── apps/           # Applications (website - Vitepress)
├── examples/       # Example projects (basic, vercel-ai, voltagent)
├── tools/          # Nx generators (@tools/core)
├── docs/           # Contributor documentation
└── scripts/        # Build/automation scripts
```
