# Commit Changes

Validate, commit, and push changes to the repository.

## Steps

### 1. Run validation

```bash
pnpm agents validate
```

This runs build, type checking, tests, and linting in CI mode.

### 2. Fix any issues

For lint errors:

```bash
pnpm fix
```

For type errors, check the specific package:

```bash
cd packages/core && pnpm types
```

### 3. Stage your changes

```bash
git add .
```

Or stage specific files:

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
