# Build Troubleshooting

Common build issues and fixes.

## TypeScript errors during build

Build fails with type errors.

**Fix:** Run `pnpm build` from root to build dependencies first.

```bash
pnpm build
```

## Nx cache issues

Stale builds or unexpected behavior.

**Fix:** Reset the Nx cache.

```bash
nx reset
pnpm build
```

## Missing dependencies

Build fails with "module not found" errors.

**Fix:** Reinstall dependencies.

```bash
rm -rf node_modules
pnpm install
pnpm build
```

## Dist folder not found

Imports fail because dist folder doesn't exist.

**Fix:** Build the package first.

```bash
pnpm build
```

## Circular dependency warnings

Build warns about circular dependencies.

**Fix:** Refactor to break the cycle. Common patterns:

- Extract shared types to a separate file
- Use dependency injection
- Restructure imports to go one direction

## tsdown build fails

tsdown bundling fails with cryptic errors.

**Fix:** Check tsdown configuration in `tsdown.config.ts`. Common issues:

- Incorrect entry points
- Missing external dependencies
- Invalid TypeScript syntax

```bash
# Debug with verbose output
pnpm --filter @viteval/core build
```

## References

- [Commands](../commands.md)
- [Setup Local Environment](../guides/setup-local-env.md)
