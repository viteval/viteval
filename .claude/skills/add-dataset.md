---
name: add-dataset
description: >-
  This skill should be used when the user wants to "create a dataset", "add new dataset",
  "scaffold dataset", "add eval data", or "set up test data". Creates a new dataset
  component using the defineDataset() pattern with configurable storage types.
---

# Add Dataset

Create a new dataset component following the viteval patterns.

## Usage

`/add-dataset <name> [options]`

## Options

| Option | Description |
|--------|-------------|
| `<name>` | Name of the dataset (kebab-case, e.g., `color-questions`) |
| `--storage` | Storage type: `memory`, `local`, or `global` (default: `local`) |
| `--description` | Description for JSDoc |

## Instructions

1. **Gather information:**
   - Dataset name (required, kebab-case)
   - Storage type preference
   - Data structure (input/expected/extra fields)

2. **Read existing patterns:**
   - Reference `packages/core/src/dataset/dataset.ts` for `defineDataset` usage
   - Check `packages/core/src/dataset/index.ts` for export patterns

3. **Generate the dataset file:**
   - Location: `packages/core/src/dataset/<name>.ts`
   - Follow the template pattern below

4. **Generate the test file:**
   - Location: `packages/core/src/dataset/<name>.test.ts`
   - Co-located with source file

5. **Update barrel exports:**
   - Add export to `packages/core/src/dataset/index.ts`

6. **Run validation:**
   - Execute `pnpm --filter @viteval/core types` to verify types
   - Execute `pnpm --filter @viteval/core test` to run tests

## Template

### Dataset File (`packages/core/src/dataset/<name>.ts`)

```typescript
import { defineDataset } from './dataset';

/**
 * <Description of the dataset>
 *
 * @example
 * ```ts
 * import { <camelCaseName> } from '@viteval/core';
 *
 * const data = await <camelCaseName>.load();
 * // data: Array<{ input: string; expected: string; }>
 * ```
 */
export const <camelCaseName> = defineDataset({
  name: '<name>',
  storage: '<storage>',
  data: async () => {
    // Generate or fetch data
    return [
      {
        input: 'example input',
        expected: 'example expected output',
      },
    ];
  },
});
```

### Test File (`packages/core/src/dataset/<name>.test.ts`)

```typescript
import { describe, expect, it } from 'vitest';
import { <camelCaseName> } from './<name>';

describe('<name> dataset', () => {
  it('should have correct name', () => {
    expect(<camelCaseName>.name).toBe('<name>');
  });

  it('should have correct storage type', () => {
    expect(<camelCaseName>.storage).toBe('<storage>');
  });

  it('should load data', async () => {
    const data = await <camelCaseName>.load({ create: true });
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should return items with input and expected', async () => {
    const data = await <camelCaseName>.load({ create: true });
    if (data && data.length > 0) {
      expect(data[0]).toHaveProperty('input');
      expect(data[0]).toHaveProperty('expected');
    }
  });
});
```

### Export Update (`packages/core/src/dataset/index.ts`)

```typescript
export { <camelCaseName> } from './<name>';
```

## Storage Types

| Type | Description |
|------|-------------|
| `memory` | Data generated fresh each run, never persisted |
| `local` | Stored in `.viteval/datasets/<name>.json` per project |
| `global` | Stored in `~/.viteval/datasets/<name>.json` globally |

## Examples

**Create a QA dataset with local storage:**
```
/add-dataset qa-pairs --storage local --description "Question-answer pairs for testing"
```

**Create a synthetic dataset (memory only):**
```
/add-dataset synthetic-prompts --storage memory --description "Dynamically generated prompts"
```

## Checklist

- [ ] Dataset file created at correct location
- [ ] Test file created and co-located
- [ ] Export added to barrel file
- [ ] Storage type correctly set
- [ ] Types pass (`pnpm --filter @viteval/core types`)
- [ ] Tests pass (`pnpm --filter @viteval/core test`)
