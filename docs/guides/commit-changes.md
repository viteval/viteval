# Commit Changes

Validate, commit, and push changes to the repository.

## Prerequisites

- Local environment set up (see [Setup Local Environment](./setup-local-env.md))
- Changes made to files in the repository
- Git configured with name and email

## Steps

### 1. Fix any issues

This will pre-fix any issues before running validation.

```bash
pnpm fix
```

### 2. Run validation

```bash
pnpm validate
```

This runs build, type checking, tests, and linting in CI mode.

### 3. Stage your changes

```bash
git add .
```

Or stage specific files (preferred):

```bash
git add packages/core/src/my-feature/
```

### 4. Create a commit

```bash
git commit -m "feat(core): add my-feature"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type       | Description                  |
| ---------- | ---------------------------- |
| `feat`     | New feature                  |
| `fix`      | Bug fix                      |
| `docs`     | Documentation                |
| `refactor` | Code change (no feature/fix) |
| `test`     | Adding tests                 |
| `chore`    | Maintenance                  |

### 5. Push to remote

```bash
git push origin my-branch
```

Or set upstream on first push:

```bash
git push -u origin my-branch
```

## Verification

Check the commit was created:

```bash
git log -1
```

Verify the push succeeded:

```bash
git status
```

Expected: "Your branch is up to date with 'origin/my-branch'."

## Troubleshooting

### Validation fails

**Issue:** `pnpm validate` fails with errors.

**Fix:** Run fix command first, then address remaining issues:

```bash
pnpm fix
pnpm validate
```

Check specific errors:

- Lint errors: `pnpm lint`
- Type errors: `pnpm types`
- Test failures: `pnpm test`

### Pre-commit hook fails

**Issue:** Commit is rejected by pre-commit hooks.

**Fix:** Fix the issues reported by the hook, then retry:

```bash
pnpm fix
git add .
git commit -m "your message"
```

### Push rejected

**Issue:** Push fails with "rejected" or "non-fast-forward" error.

**Fix:** Pull latest changes and resolve conflicts:

```bash
git pull --rebase origin my-branch
# Resolve any conflicts
git push origin my-branch
```

## References

- [Publish Changes](./publish-changes.md) - Create a changeset for release
