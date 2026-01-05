# Commit Changes

Validate, commit, and push changes to the repository.

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

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `refactor` | Code change (no feature/fix) |
| `test` | Adding tests |
| `chore` | Maintenance |

### 5. Push to remote

```bash
git push origin my-branch
```

Or set upstream on first push:

```bash
git push -u origin my-branch
```

## References

- [Publish Changes](./publish-changes.md) - Create a changeset for release
