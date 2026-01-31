---
name: validate
description: >-
  This skill should be used when the user wants to "check code quality", "run type check",
  "verify linting", "check formatting", "run CI validation", "check types", "validate code",
  or "check for errors". Handles TypeScript type checking, linting, and format verification.
---

# Validate

Run comprehensive code validation including TypeScript type checking, linting, and format verification.

## Usage

`/validate [options]`

## Options

| Option | Description |
|--------|-------------|
| `--types` | Run only TypeScript type checking |
| `--lint` | Run only linting checks |
| `--format` | Run only format verification |
| `--full` | Run full CI validation (check, types, test, build) |

## Instructions

1. **Determine validation scope:**
   - Default: Run `pnpm check` (lint + format verification)
   - `--types`: Run `pnpm types` only
   - `--lint`: Run `pnpm check` only
   - `--full`: Run `pnpm validate` (complete CI validation)

2. **Execute validation commands:**
   ```bash
   # Default validation
   pnpm check

   # Type checking
   pnpm types

   # Full CI validation
   pnpm validate
   ```

3. **Parse and report results:**
   - Group errors by file
   - Include file:line references for each issue
   - Categorize issues (type error, lint error, format error)

4. **Suggest fixes:**
   - For lint/format issues: Suggest `/fix` command
   - For type errors: Show the specific type mismatch
   - For complex issues: Provide guidance on manual fixes

## Examples

**Default validation (lint + format):**
```
/validate
→ pnpm check
```

**Type checking only:**
```
/validate --types
→ pnpm types
```

**Full CI validation:**
```
/validate --full
→ pnpm validate
```

## Output Format

Report issues in this format:
```
## Type Errors (2 issues)

packages/core/src/scorer/custom.ts:15:3
  Type 'string' is not assignable to type 'number'

packages/core/src/dataset/dataset.ts:42:10
  Property 'name' is missing in type...

## Lint Errors (1 issue)

packages/cli/src/index.ts:8:1
  Unexpected console statement (no-console)

## Summary
- 2 type errors
- 1 lint error
- Run `/fix` to auto-fix lint issues
```

## Related

- **For auto-fixing issues:** Use `/fix` skill
- **For autonomous validation with intelligent fixing:** Use the `code-validator` agent
