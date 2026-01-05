# Development Commands

Commands for developing, testing, and building Viteval using `pnpm` scripts.

## Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | `pnpm install` |
| Build all packages | `pnpm build` |
| Run all tests | `pnpm test` |
| Fix lint issues | `pnpm fix` |
| Validate (CI mode) | `pnpm validate` |

## Commands

Run from the repository root.

### Building

```bash
# Build all packages
pnpm build

# Build in watch mode
pnpm dev
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test -- --coverage
```

### Code Quality

```bash
# Check linting
pnpm check

# Fix linting issues
pnpm fix

# Type check all packages
pnpm types

# Type check packages only
pnpm types:packages

# Type check examples only
pnpm types:examples
```

### Versioning

```bash
# Create a changeset
pnpm changeset

# Apply changesets and bump versions
pnpm version

# Publish packages
pnpm publish
```

### Website

```bash
# Build website
pnpm build:website

# Run website dev server
pnpm dev:website
```

## Troubleshooting

### Command not found

pnpm command fails.

**Fix:** Run `corepack enable` to enable pnpm.

### Build fails with type errors

TypeScript errors during build.

**Fix:** Run `pnpm build` from root to build dependencies first.

### Nx cache issues

Stale builds or unexpected behavior.

**Fix:** Run `nx reset` to clear the cache.
