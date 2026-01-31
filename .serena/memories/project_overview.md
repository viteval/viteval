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

```text
viteval/
├── packages/       # Core packages (@viteval/core, cli, ui, internal, viteval)
├── apps/           # Applications (website - Vitepress)
├── examples/       # Example projects (basic, vercel-ai, voltagent)
├── tools/          # Nx generators (@tools/core)
├── docs/           # Contributor documentation
└── scripts/        # Build/automation scripts
```

## Documentation Structure

```text
docs/
├── README.md                    # Documentation index with table navigation
├── development.md               # SDLC workflow overview
├── architecture.md              # Package architecture
├── structure.md                 # Repository layout
├── commands.md                  # Development commands
├── technology.md                # Tech stack reference
├── coding-agents.md             # AI coding philosophy
├── concepts/                    # Core concepts
│   ├── evaluation.md           # Evaluation concepts
│   ├── scorers.md              # Scorer usage
│   └── datasets.md             # Dataset formats
├── guides/                      # Step-by-step guides
│   ├── setup-local-env.md
│   ├── configure-ide.md
│   ├── configure-coding-agents.md
│   ├── add-feature.md
│   ├── add-package.md
│   ├── add-test.md
│   ├── add-example.md
│   ├── add-mock.md
│   ├── commit-changes.md
│   └── publish-changes.md
├── standards/                   # Coding standards
│   ├── git-commits.md          # Commit message format
│   ├── testing.md              # Testing patterns
│   ├── documentation/
│   │   ├── writing.md          # Doc writing standards
│   │   └── writing-guides.md   # Guide template
│   └── typescript/
│       ├── overview.md         # TypeScript index
│       ├── naming.md           # Naming conventions
│       └── patterns.md         # Import patterns
└── troubleshooting/             # Issue resolution
    ├── build.md                # Build issues
    └── cli.md                  # CLI issues
```
