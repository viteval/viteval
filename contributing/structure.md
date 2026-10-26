# Project Structure

High-level overview of the Viteval monorepo.

## Directory Layout

```
viteval/
├── packages/       # Core packages
├── docs/           # Public v1 documentation
├── public/         # Documentation assets
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

## Documentation

`ciderpress.config.ts` at the repository root defines the public site using
Markdown under `docs/` and static assets under `public/`. Ciderpress generates
`.ciderpress/`; no separate website workspace or legacy archive is maintained.
The `contributing/` directory remains internal contributor documentation.

The homepage is a custom React composition mounted by `docs/index.mdx`.
Edit `docs/visuals/landing-page.tsx` for section order and content,
`feature-panels.tsx` for feature copy, and `feature-scenes.tsx` for animated
artwork. The feature boxes inherit the page surface; color belongs in the
artwork, not separate card backgrounds. The `#docs/*` package import keeps
component imports stable when Ciderpress syncs Markdown into its generated tree.

`scripts/patches/@ciderpress__cli@1.0.0-rc.17.patch` fixes the CLI's explicit-home
check to recognize both `index.md` and `index.mdx`. Remove the package patch
once an upstream release includes that fix.

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
