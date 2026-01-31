# Publish Changes

Create a changeset and publish packages.

> [!TIP]
> You will need to [commit changes](./commit-changes.md) before publishing.

## Prerequisites

- Local environment set up (see [Setup Local Environment](./setup-local-env.md))
- Changes committed to a feature branch
- PR ready to merge (or about to be created)

## Steps

### 1. Create a changeset

```bash
pnpm changeset
```

### 2. Select affected packages

Use arrow keys and space to select package(s) that changed.

### 3. Choose the bump type

| Change          | Bump          |
| --------------- | ------------- |
| Bug fix         | Patch (0.0.x) |
| New feature     | Minor (0.x.0) |
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

## Verification

Verify the changeset was created:

```bash
ls .changeset/
```

Expected: A new `.md` file with a random name (e.g., `tall-pens-glow.md`).

Check the changeset content:

```bash
cat .changeset/*.md
```

After merge, verify the package was published:

```bash
npm view @viteval/core version
```

## Troubleshooting

### No packages selected in changeset

**Issue:** Changeset wizard shows no packages to select.

**Fix:** Ensure you have made changes to a package's source files:

```bash
git diff --name-only main
```

If changes are only in non-package directories, no changeset is needed.

### Changeset already exists for this change

**Issue:** You want to modify an existing changeset.

**Fix:** Edit the changeset file directly or delete and recreate:

```bash
rm .changeset/old-changeset-name.md
pnpm changeset
```

### Release workflow fails

**Issue:** The automated release fails after merge.

**Fix:** Check GitHub Actions for error details. Common issues:

- npm authentication failure (check NPM_TOKEN secret)
- Version conflict (package already published at that version)
- Build failure (run `pnpm validate` locally)

## References

- [Changesets Documentation](https://github.com/changesets/changesets)
