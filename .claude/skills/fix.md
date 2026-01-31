---
name: fix
description: >-
  This skill should be used when the user wants to "fix lint errors", "auto-fix formatting",
  "fix code style", "run pnpm fix", or "fix the code". Handles automatic fixing of linting
  and formatting issues using oxlint and oxfmt.
---

# Fix

Automatically fix linting and formatting issues across the codebase.

## Usage

`/fix [options]`

## Options

| Option      | Description                                       |
| ----------- | ------------------------------------------------- |
| `--dry-run` | Show what would be fixed without applying changes |

## Instructions

1. **Run the fix command:**

   ```bash
   pnpm fix
   ```

   This runs oxlint with `--fix` and oxfmt to auto-fix issues.

2. **Capture and report changes:**
   - Note which files were modified
   - Summarize the types of fixes applied

3. **Verify fixes:**
   - Run `pnpm check` after fixing to verify all issues resolved
   - Report any remaining issues that require manual fixes

4. **For dry-run mode:**
   - Run `pnpm check` first to show current issues
   - Explain what `/fix` would fix vs what needs manual intervention

## Examples

**Fix all auto-fixable issues:**

```
/fix
→ pnpm fix
→ pnpm check (verify)
```

**Preview what would be fixed:**

```
/fix --dry-run
→ pnpm check (show issues)
→ Explain what's auto-fixable
```

## Output Format

```
## Fixes Applied

Modified 3 files:
- packages/core/src/scorer/custom.ts (formatting)
- packages/cli/src/index.ts (lint: prefer-const)
- packages/ui/src/App.tsx (formatting, lint: no-unused-vars)

## Verification

Running validation check...
All checks passed.

## Manual Fixes Required

None - all issues resolved automatically.
```

Or if manual fixes needed:

```
## Fixes Applied

Modified 2 files...

## Manual Fixes Required

packages/core/src/evaluate/evaluate.ts:45:10
  Type error - cannot auto-fix. The return type doesn't match...

  Suggested fix:
  Change the return type from `Promise<void>` to `Promise<EvalResult[]>`
```

## Related

- **To check for issues first:** Use `/validate` skill
- **For comprehensive validation with auto-fixing:** Use the `code-validator` agent
