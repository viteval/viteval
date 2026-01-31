# Suggested Commands

All commands should be run from the repository root.

## Essential Commands

| Task | Command |
|------|---------|
| Install dependencies | `pnpm install` |
| Build all packages | `pnpm build` |
| Run all tests | `pnpm test` |
| Validate (CI mode) | `pnpm validate` |
| Fix lint/format | `pnpm fix` |

## Development

| Task | Command |
|------|---------|
| Build in watch mode | `pnpm dev` |
| Check linting | `pnpm lint` |
| Fix linting issues | `pnpm lint:fix` |
| Check formatting | `pnpm format` |
| Fix formatting | `pnpm format:fix` |
| Type check all | `pnpm types` |
| Type check packages | `pnpm types:packages` |
| Type check examples | `pnpm types:examples` |

## Versioning & Publishing

| Task | Command |
|------|---------|
| Create a changeset | `pnpm changeset` |
| Apply changesets | `pnpm version` |
| Publish packages | `pnpm publish` |

## Website

| Task | Command |
|------|---------|
| Build website | `pnpm build:website` |
| Run website dev server | `pnpm dev:website` |

## Nx Commands

| Task | Command |
|------|---------|
| Run generator | `pnpm gen` |
| Reset Nx cache | `nx reset` |

## System Utilities (Darwin/macOS)

Standard Unix commands work: `git`, `ls`, `cd`, `grep`, `find`
- Note: macOS `find` has slightly different flags than GNU `find`
- Use `gfind` from `findutils` for GNU compatibility if needed
