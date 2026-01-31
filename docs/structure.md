# Project Structure

High-level overview of the Viteval monorepo.

## Directory Layout

```
viteval/
├── packages/       # Core packages
├── apps/           # Applications (website)
├── examples/       # Example projects
├── tools/          # Code generators
├── docs/           # Contributor documentation
└── scripts/        # Build/automation scripts
```

## Packages

| Package             | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `@viteval/core`     | Main evaluation APIs (evaluate, scorers, datasets) |
| `@viteval/internal` | Shared utilities (internal use only)               |
| `@viteval/cli`      | Command-line interface                             |
| `viteval`           | Main package (re-exports core + CLI)               |
| `@viteval/ui`       | Web UI for viewing results                         |

See [Architecture](./architecture.md) for how packages work together.

### Package Structure

Each package follows a consistent structure:

```
packages/core/
├── src/
│   ├── index.ts        # Public exports
│   ├── evaluate/       # Evaluation engine
│   │   ├── evaluate.ts
│   │   └── types.ts
│   ├── scorer/         # Scorer implementations
│   │   ├── create.ts
│   │   ├── builtin/
│   │   └── types.ts
│   └── dataset/        # Dataset utilities
│       ├── define.ts
│       ├── storage.ts
│       └── types.ts
├── package.json
├── tsconfig.json
├── tsdown.config.ts    # Build configuration
└── vitest.config.ts    # Test configuration
```

### Key Files

| File               | Purpose                                 |
| ------------------ | --------------------------------------- |
| `src/index.ts`     | Public API exports                      |
| `package.json`     | Dependencies and scripts                |
| `tsconfig.json`    | TypeScript configuration (extends root) |
| `tsdown.config.ts` | Build settings for tsdown               |
| `vitest.config.ts` | Test runner configuration               |

## Apps

| App       | Purpose                        |
| --------- | ------------------------------ |
| `website` | Documentation site (Vitepress) |

## Tools

| Tool          | Purpose                             |
| ------------- | ----------------------------------- |
| `@tools/core` | Nx generators for packages/examples |

## Examples

| Example     | Purpose                   |
| ----------- | ------------------------- |
| `basic`     | Basic evaluation example  |
| `vercel-ai` | Vercel AI SDK integration |
| `voltagent` | Voltagent integration     |
