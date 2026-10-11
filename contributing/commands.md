# Development Commands

Commands for developing, testing, and building Viteval using `pnpm` scripts.

## Quick Reference

| Task                  | Command                  |
| --------------------- | ------------------------ |
| Install dependencies  | `pnpm install`           |
| Build all packages    | `pnpm build`             |
| Run all tests         | `pnpm test`              |
| Measure coverage      | `pnpm test:coverage`     |
| Fix lint issues       | `pnpm fix`               |
| Validate (CI mode)    | `pnpm validate`          |
| Verify packed install | `pnpm validate:consumer` |
| Verify browser flow   | `pnpm validate:browser`  |

## Commands

Run from the repository root.

Use root scripts or Turbo filters for provider checks so Prisma generation runs
once before build, typecheck, and tests:

```bash
pnpm exec turbo run test --filter=@viteval/providers
```

### Building

```bash
# Build all packages
pnpm build

# Build in watch mode
pnpm dev
```

Turbo uses its interactive terminal UI by default. Use `pnpm dev:website` for the
docs site or `pnpm dev:ui examples/basic` for the dashboard pointed at an example.
Select a task in the TUI to inspect its logs and interact with its process.

### Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

Coverage runs include the package tests and native Vitest workers launched by the
CLI contract harness. Core unit and worker blob reports merge into
`packages/viteval/coverage/native-workers/`, with HTML, JSON, and summary output.
CLI bootstrap execution is outside the worker coverage report. CI retains
coverage artifacts for 14 days.

### Browser verification

Requires a running Orca desktop with this repository added. Run from the root:

```bash
pnpm validate:browser
```

The check creates an isolated project, initializes and runs native evals, then
uses Orca's embedded browser to inspect empty projects, multiple Vitest projects,
passing/failing/skipped outcomes, dataset extra fields, malformed files, and
tag creation/removal across reloads. It cleans up its project, server, and tab.
Tag removal uses DOM click activation because Orca's ref activation does not
dispatch that icon-only control reliably. Browser checks require Orca and run
locally; they are separate from the GitHub-hosted CI jobs.

### Compiled CLI

Requires Bun >=1.3 and a built workspace. Commands run from the repository root.

```bash
pnpm build
pnpm --filter @viteval/cli build:binary
pnpm --filter @viteval/cli test:binary
```

The default target matches the current platform. Pass targets explicitly to
cross-compile:

```bash
pnpm --filter @viteval/cli build:binary darwin-arm64 linux-x64
```

Single-target builds write `packages/cli/dist/bin/viteval` (`viteval.exe` on
Windows). Multiple targets add a platform suffix. Compilation runs separately
from the normal npm build. `test:binary` rebuilds the host binary and runs the
same CLI integration suite used for the Node entry point.

Help and initialization work outside an installed project. Evaluation, dataset,
and UI commands require a project installation of `viteval` and Node >=26 on PATH.

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

### Turborepo cache issues

Stale builds or unexpected behavior.

**Fix:** Remove `.turbo/cache` to clear the local cache.
