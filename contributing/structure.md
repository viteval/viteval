# Project Structure

High-level overview of the Viteval monorepo.

## Directory Layout

```
viteval/
├── packages/       # Core packages
├── apps/           # Applications (website)
├── examples/       # Example projects
├── tools/          # Generator templates
├── turbo/          # Turborepo generator configuration
├── contributing/   # Contributor documentation
└── scripts/        # Build and development scripts
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

## Apps

| App       | Purpose                        |
| --------- | ------------------------------ |
| `website` | Documentation site (Vitepress) |

## Tools

| Path         | Purpose                                     |
| ------------ | ------------------------------------------- |
| `turbo/`     | Turborepo generators for packages/examples  |
| `tools/core` | Template files consumed by those generators |

## Examples

| Example     | Purpose                   |
| ----------- | ------------------------- |
| `basic`     | Basic evaluation example  |
| `vercel-ai` | Vercel AI SDK integration |
| `voltagent` | Voltagent integration     |
