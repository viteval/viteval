# viteval

Viteval is a framework for evaluating LLMs. It is built on top of Vitest and is designed to be used in a CI/CD pipeline.

## Detailed Documentation

For comprehensive contributor documentation, see the [docs/](./docs/) directory:

- [docs/README.md](./docs/README.md) - Documentation index
- [docs/structure.md](./docs/structure.md) - Project structure
- [docs/patterns.md](./docs/patterns.md) - Code patterns
- [docs/testing.md](./docs/testing.md) - Testing overview
- [docs/commands.md](./docs/commands.md) - Development commands
- [docs/packages/](./docs/packages/) - Package-specific documentation

## Structure

Below is a high-level overview of the repository structure.

- `packages/` - Contains the core packages for viteval
- `examples/` - Contains examples of how to use viteval
- `tools/` - Contains tools for viteval
- `apps/website` - Contains the documentation website for viteval, built with Vitepress (https://vitepress.dev/)
- `docs/` - Contains contributor documentation for developers and AI
- `scripts/` - Contains scripts for viteval

### Packages

The `packages/` directory contains the following packages:

- `packages/core` - Contains the core functionality for viteval
- `packages/internal` - Contains the internal utilities for viteval
- `packages/cli` - Contains the CLI for viteval
- `packages/viteval` - Contains the main viteval package, that re-exports the core and internal packages
- `packages/ui` - Contains the web UI for viewing evaluation results

## Development Instructions

- To validate changes to the codebase, run `pnpm agents validate` from the root of the repository
- To validate changes to a specific package, you need to change to the package directory and run `pnpm agents validate`
- You can also run any command from the root of the repository by running `pnpm agents <command>` or from a package directory by changing to the package directory and running `pnpm agents <command>`
- Prefer functional programming over object-oriented programming
- Add JSDoc blocks for all public APIs, and add examples for each API

## Testing Instructions

`vitest` is used for testing. Follow the following instructions when creating, writing, and running tests:

- All tests must be co-located with the code they are testing, in the format `**/<file-name>.test.ts`
- All tests must import the necessary functions from `vitest`, for example `describe`, `it`, `expect`, etc.
- BDD style is preferred, for example `describe`, `it`, `expect`, etc.
- To run tests across all packages, run `pnpm agents test` from the root of the repository
- To run tests for a specific package, you need to change to the package directory and run `pnpm agents test`

## Documentation Instructions

- The documentation is built with Vitepress (https://vitepress.dev/)
- The documentation is located in the `apps/website` directory
- The documentation is written in markdown but can render HTML