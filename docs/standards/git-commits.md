# Commit Standards

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear, structured commit history that enables automated versioning and changelog generation.

## Format

```
type(scope): description

[optional body]

[optional footer]
```

## Types

| Type       | Description      | Usage                     |
| ---------- | ---------------- | ------------------------- |
| `feat`     | New feature      | User-facing functionality |
| `fix`      | Bug fix          | Fixes broken behavior     |
| `docs`     | Documentation    | Only doc changes          |
| `refactor` | Code refactoring | No behavior change        |
| `test`     | Add/update tests | Test files only           |
| `chore`    | Maintenance      | Build, deps, config       |
| `perf`     | Performance      | Optimization              |

## Scopes

Scopes identify what part of the codebase changed. Use package names for clarity.

### Package Scopes

| Scope      | Description           |
| ---------- | --------------------- |
| `core`     | @viteval/core package |
| `cli`      | @viteval/cli package  |
| `ui`       | @viteval/ui package   |
| `internal` | @viteval/internal     |
| `viteval`  | viteval main package  |

### Other Scopes

| Scope      | Description        |
| ---------- | ------------------ |
| `deps`     | Dependencies       |
| `ci`       | CI/CD changes      |
| `repo`     | Workspace config   |
| `docs`     | Documentation only |
| `examples` | Example projects   |

## Examples

### Feature

```bash
git commit -m "feat(core): add custom scorer validation"
```

### Bug Fix

```bash
git commit -m "fix(cli): prevent double evaluation on watch mode"
```

### Documentation

```bash
git commit -m "docs: add scorer API reference"
```

### Refactor

```bash
git commit -m "refactor(core): optimize dataset loading"
```

### Chore

```bash
git commit -m "chore(deps): update vitest to 3.0.0"
```

## Breaking Changes

### Format

Breaking changes must be indicated with `!` and `BREAKING CHANGE:` footer:

```bash
git commit -m "feat(core)!: change scorer return type

BREAKING CHANGE: scorers must now return ScorerResult instead of number"
```

### When to Use

Mark as breaking when:

- Removing or renaming public APIs
- Changing function signatures
- Modifying configuration schema
- Updating required dependencies

## Best Practices

### Do

- Use lowercase for type and scope
- Keep description under 72 characters
- Start description with verb (add, fix, update)
- Use present tense ("add" not "added")
- Be specific and descriptive
- Reference issues when relevant

### Don't

- End description with period
- Use vague descriptions ("fix bug", "update code")
- Include issue numbers in description (use footer)
- Combine unrelated changes
- Commit without running validation

## Commit Workflow

### 1. Stage Changes

```bash
# Stage specific files (preferred)
git add packages/core/src/scorer.ts

# Or stage all
git add .
```

### 2. Validate

```bash
# Auto-fix issues
pnpm fix

# Run validation
pnpm validate
```

### 3. Commit

```bash
git commit -m "type(scope): description"
```

### 4. Push

```bash
git push origin your-branch
```

## Atomic Commits

Make commits atomic - each commit should:

- Represent one logical change
- Build and pass tests independently
- Be revertable without side effects

### Good

```bash
git commit -m "feat(core): add exact match scorer"
git commit -m "test(core): add exact match scorer tests"
git commit -m "docs: document exact match scorer"
```

### Bad

```bash
# Too many unrelated changes
git commit -m "feat: add scorer and fix bugs and update docs"
```

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commit Changes Guide](../guides/commit-changes.md)
- [Development Lifecycle](../development.md)
