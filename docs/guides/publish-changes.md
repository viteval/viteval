# Publish Changes

Create a changeset and publish packages.

> [!TIP]
> First complete [Commit Changes](./commit-changes.md)

## Steps

### 1. Create a changeset

```bash
pnpm changeset
```

### 2. Select affected packages

Use arrow keys and space to select package(s) that changed.

### 3. Choose the bump type

| Change | Bump |
|--------|------|
| Bug fix | Patch (0.0.x) |
| New feature | Minor (0.x.0) |
| Breaking change | Major (x.0.0) |

### 4. Write the changelog entry

Describe what changed and why. This appears in the package changelog.

### 5. Commit the changeset

```bash
git add .changeset/
git commit -m "chore: add changeset"
git push
```

### 6. Merge to main

Once your PR is merged, the release workflow will:
- Update package versions
- Generate changelogs
- Publish to npm

## References

- [Changesets Documentation](https://github.com/changesets/changesets)
