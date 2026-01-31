---
name: test
description: >-
  This skill should be used when the user wants to "run tests", "run unit tests",
  "run vitest", "check test coverage", "run tests in watch mode", or "test the code".
  Handles test execution for viteval packages with filtering, coverage, and watch mode.
---

# Test

Run tests for all packages or filter by specific package/pattern.

## Usage

`/test [options]`

## Options

| Option | Description |
|--------|-------------|
| `--filter <pkg>` | Filter to specific package (core, cli, ui, viteval) |
| `--pattern <file>` | Run tests matching file pattern |
| `--coverage` | Generate coverage report |
| `--watch` | Run in watch mode |
| `--update` | Update snapshots |
| `--ui` | Open Vitest UI |

## Instructions

1. **Determine scope from context:**
   - If user specifies a package, use `pnpm --filter @viteval/<pkg> test`
   - If user specifies a file pattern, append `-- <pattern>`
   - If no filter specified, run `pnpm test` for all packages

2. **Auto-detect package from current file:**
   - If user is working in a specific package directory, default to that package
   - Package can be inferred from file path (e.g., `packages/core/...` → `@viteval/core`)

3. **Handle options:**
   - `--coverage`: Append `-- --coverage`
   - `--watch`: Append `-- --watch`
   - `--pattern`: Append `-- <pattern>`

4. **Run the command and report results:**
   - Show test summary (passed, failed, skipped)
   - For failures, show file:line references
   - Suggest next steps for failures

## Examples

**Run all tests:**
```
/test
→ pnpm test
```

**Run core package tests:**
```
/test --filter core
→ pnpm --filter @viteval/core test
```

**Run with coverage:**
```
/test --coverage
→ pnpm test -- --coverage
```

**Run specific test file:**
```
/test --pattern scorer
→ pnpm test -- scorer
```

**Watch mode for core:**
```
/test --filter core --watch
→ pnpm --filter @viteval/core test -- --watch
```

## Output Format

```
## Test Results

### Summary
- Total: 42 tests
- Passed: 40
- Failed: 2
- Skipped: 0

### Failures

packages/core/src/scorer/custom.test.ts:25:5
  ✗ should return 1.0 for exact match
    Expected: 1.0
    Received: 0.95

packages/core/src/dataset/dataset.test.ts:18:5
  ✗ should load data correctly
    Error: Timeout - data loading exceeded 5000ms

### Next Steps
- Review failing assertions in custom.test.ts:25
- Check for async issues in dataset.test.ts:18
```

Or for passing tests:

```
## Test Results

### Summary
- Total: 42 tests
- Passed: 42
- Failed: 0
- Skipped: 0

All tests passed.
```

## Related

- **For debugging failures or scaffolding tests:** Use the `test-runner` agent
- **For comprehensive validation:** Use `/validate` or the `code-validator` agent
