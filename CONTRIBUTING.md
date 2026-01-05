# Contributing to Viteval

Thank you for contributing to Viteval!

## Prerequisites

- Node.js >= 22.0.0
- pnpm >= 10.0.0

## Quick Start

```bash
git clone https://github.com/viteval/viteval.git
cd viteval && pnpm install && pnpm build
```

> [!TIP]
> See [docs/guides/setup-local-env.md](./docs/guides/setup-local-env.md) for detailed setup.

## Common Commands

| Task | Command |
|------|---------|
| Build | `pnpm build` |
| Test | `pnpm test` |
| Lint | `pnpm check` |
| Fix lint | `pnpm fix` |
| Validate | `pnpm validate` |

> [!TIP]
> See [docs/commands.md](./docs/commands.md) for detailed commands.

## Making Changes

1. Create a feature branch from `main`
2. Make changes and add tests
3. Run `pnpm validate`
4. Create a changeset: `pnpm changeset`
5. Open a pull request

> [!TIP]
> See [docs/guides/publish-changes.md](./docs/guides/publish-changes.md) for detailed publish guide.

## Documentation

All contributor docs are in [docs/](./docs/):

- [Structure](./docs/structure.md) - Project layout
- [Architecture](./docs/architecture.md) - How packages work together
- [Commands](./docs/commands.md) - All available commands
- [Testing](./docs/testing.md) - Testing patterns
- [Guides](./docs/README.md#guides) - Step-by-step guides

## License

By contributing, you agree your contributions will be licensed under the project license.
