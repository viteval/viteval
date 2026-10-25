# Publish Changes

Create a changeset and publish packages.

> [!TIP]
> You will need to [commit changes](./commit-changes.md) before publishing.

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

## RC publishing

Keep Changesets in prerelease mode with the `rc` tag. Do not pass `--tag` to
`changeset publish` while prerelease mode is active.

The `publish.yaml` workflow uses npm trusted publishing, not `NPM_TOKEN`. Each
published package must trust GitHub organization `viteval`, repository `viteval`,
workflow filename `publish.yaml`, with direct publishing enabled and no environment.
pnpm 12 publishes natively and supplies OIDC authentication and provenance.

Merge the release changeset, then merge the generated version PR. The main-branch
workflow publishes unpublished versions and verifies a fresh registry install.
Manual dispatch on main can retry an interrupted release; it does not bump versions.
An all-already-published run does not prove OIDC publishing works.

To repeat the registry consumer check locally after publication:

```bash
pnpm exec node scripts/validate-consumer.mjs --registry
```

This checks the exact versions in the workspace manifests, not moving dist-tags.
Registry availability may lag an accepted upload; check npm staging/approval and
availability before retrying a failed publication.

## References

- [Changesets Documentation](https://github.com/changesets/changesets)
