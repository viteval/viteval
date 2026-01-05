# Viteval

LLM evaluation framework built on Vitest.

IMPORTANT: Always refer to the documentation before performing any task or any work.

<quick-reference>

## Quick Reference

| Task | Command |
|------|---------|
| Build | `pnpm build` |
| Test | `pnpm test` |
| Validate | `pnpm validate` |
| Fix lint | `pnpm fix` |

</quick-reference>

<structure>

## Structure

See [docs/structure.md](./docs/structure.md) for details.

```
viteval/
├── packages/     # Core packages (@viteval/core, cli, ui, internal, viteval)
├── apps/         # Website (Vitepress)
├── examples/     # Example projects
├── tools/        # Nx generators
└── docs/         # Contributor documentation
```

</structure>

<architecture>

## Architecture

See [docs/architecture.md](./docs/architecture.md) for details.

The `viteval` package is the unified entry point. It re-exports from internal packages (`@viteval/core`, `@viteval/cli`) so users install one package.

</architecture>

<development>

## Development

See [docs/commands.md](./docs/commands.md) for all commands.

- Run `pnpm validate` before committing
- Tests co-located with source: `*.test.ts`
- Prefer functional programming
- Add JSDoc with examples for public APIs

</development>

<testing>

## Testing

See [docs/testing.md](./docs/testing.md) for patterns.

- Use Vitest (`describe`, `it`, `expect`)
- BDD style preferred
- Co-locate tests: `feature.ts` → `feature.test.ts`

</testing>

<documentation>

## Documentation

See [docs/documentation.md](./docs/documentation.md) for standards.

- Website: `apps/website/` (Vitepress)
- Contributor docs: `docs/`

</documentation>

<guides>

## Guides

Step-by-step instructions in [docs/guides/](./docs/guides/):

- [Setup Local Environment](./docs/guides/setup-local-env.md)
- [Configure IDE](./docs/guides/configure-ide.md)
- [Add a Package](./docs/guides/add-package.md)
- [Add a Feature](./docs/guides/add-feature.md)
- [Add an Example](./docs/guides/add-example.md)
- [Add a Test](./docs/guides/add-test.md)
- [Add a Mock](./docs/guides/add-mock.md)
- [Commit Changes](./docs/guides/commit-changes.md)
- [Publish Changes](./docs/guides/publish-changes.md)

</guides>
