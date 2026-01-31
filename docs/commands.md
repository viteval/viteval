# Development Commands

Commands for developing, testing, and building Viteval using `pnpm` scripts.

## Quick Reference

| Task                 | Command         |
| -------------------- | --------------- |
| Install dependencies | `pnpm install`  |
| Build all packages   | `pnpm build`    |
| Run all tests        | `pnpm test`     |
| Fix lint issues      | `pnpm fix`      |
| Validate (CI mode)   | `pnpm validate` |

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

## Per-Package Commands

Run commands for a specific package:

```bash
# Build specific package
pnpm --filter @viteval/core build

# Test specific package
pnpm --filter @viteval/core test

# Dev mode for specific package
pnpm --filter @viteval/cli dev
```

## Environment Variables

| Variable              | Description                |
| --------------------- | -------------------------- |
| `VITEVAL_DEBUG`       | Enable debug output        |
| `VITEVAL_TIMEOUT`     | Default evaluation timeout |
| `VITEVAL_CONCURRENCY` | Default concurrency        |

## Troubleshooting

### Command not found

**Issue:** pnpm command fails with "command not found".

**Fix:** Enable pnpm via corepack:

```bash
corepack enable
```

### Build fails with type errors

**Issue:** TypeScript errors during build.

**Fix:** Build dependencies first by running from root:

```bash
pnpm build
```

### Nx cache issues

**Issue:** Stale builds or unexpected behavior.

**Fix:** Clear the Nx cache:

```bash
nx reset
```

### Tests fail to find modules

**Issue:** Tests can't import workspace packages.

**Fix:** Ensure packages are built:

```bash
pnpm build
pnpm test
```

### Changeset not detected

**Issue:** Running `pnpm changeset` shows no changes.

**Fix:** Verify changes are in package directories:

```bash
git diff --name-only main
```

Changes to non-package files (docs, tools) don't require changesets.

### Lock file conflicts

**Issue:** pnpm-lock.yaml has merge conflicts.

**Fix:** Regenerate the lock file:

```bash
rm pnpm-lock.yaml
pnpm install
```

## References

- [Setup Local Environment](./guides/setup-local-env.md) - Initial setup
- [Architecture](./architecture.md) - How packages work together
