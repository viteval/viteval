# Task Completion Checklist

Run these commands before committing any changes.

## Required Steps

### 1. Validate All Packages
```bash
pnpm validate
```
This runs: `check`, `types`, `test`, `build` in parallel.

### 2. If Validation Fails

**Lint/Format Issues:**
```bash
pnpm fix
```

**Type Errors:**
```bash
pnpm types
```
Check the specific package for type issues.

**Test Failures:**
```bash
pnpm test
```
Fix failing tests.

**Build Errors:**
```bash
pnpm build
```
Ensure dependencies are built first.

## Version Changes

If changing public API or adding features:
```bash
pnpm changeset
```
Follow the prompts to document the change.

## Quick Reference

| Check | Command |
|-------|---------|
| Full validation | `pnpm validate` |
| Fix issues | `pnpm fix` |
| Run tests | `pnpm test` |
| Build | `pnpm build` |
| Create changeset | `pnpm changeset` |

## Notes
- Always run `pnpm validate` before committing
- Tests are co-located with source files
- Use `nx reset` if encountering stale cache issues
