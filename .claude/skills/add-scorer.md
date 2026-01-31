---
name: add-scorer
description: >-
  This skill should be used when the user wants to "create a scorer", "add new scorer",
  "implement scoring", "add evaluation metric", or "scaffold scorer". Creates a new
  scorer component using the createScorer() pattern with co-located tests and exports.
---

# Add Scorer

Create a new scorer component following the viteval patterns.

## Usage

`/add-scorer <name> [options]`

## Options

| Option          | Description                                        |
| --------------- | -------------------------------------------------- |
| `<name>`        | Name of the scorer (camelCase, e.g., `exactMatch`) |
| `--description` | Description for JSDoc                              |

## Instructions

1. **Gather information:**
   - Scorer name (required, camelCase)
   - Brief description of what the scorer evaluates
   - Ask for scoring logic if not clear from the name

2. **Read existing patterns:**
   - Use Serena `find_symbol` to read `createScorer` from `packages/core/src/scorer/custom.ts`
   - Use Serena `get_symbols_overview` on `packages/core/src/scorer/` to see existing scorers
   - Check `packages/core/src/scorer/index.ts` for export patterns

3. **Generate the scorer file:**
   - Location: `packages/core/src/scorer/<name>.ts`
   - Follow the template pattern below

4. **Generate the test file:**
   - Location: `packages/core/src/scorer/<name>.test.ts`
   - Co-located with source file

5. **Update barrel exports:**
   - Add export to `packages/core/src/scorer/index.ts`

6. **Run validation:**
   - Execute `pnpm --filter @viteval/core types` to verify types
   - Execute `pnpm --filter @viteval/core test` to run tests

## Template

### Scorer File (`packages/core/src/scorer/<name>.ts`)

````typescript
import type { Extra } from '#/types';
import { createScorer } from './custom';

/**
 * <Description of what this scorer evaluates>
 *
 * @example
 * ```ts
 * const result = await <name>({
 *   output: 'actual output',
 *   expected: 'expected output',
 * });
 * // result.score: number between 0 and 1
 * ```
 */
export const <name> = createScorer<unknown, Extra>({
  name: '<name>',
  score: ({ output, expected }) => {
    // Scoring logic here
    // Return { score: number, metadata?: Record<string, unknown> }
    return {
      score: 0.0,
    };
  },
});
````

### Test File (`packages/core/src/scorer/<name>.test.ts`)

```typescript
import { describe, expect, it } from 'vitest';
import { <name> } from './<name>';

describe('<name>', () => {
  it('should return 1.0 for exact match', async () => {
    const result = await <name>({
      output: 'test',
      expected: 'test',
    });
    expect(result.score).toBe(1.0);
  });

  it('should return 0.0 for no match', async () => {
    const result = await <name>({
      output: 'foo',
      expected: 'bar',
    });
    expect(result.score).toBe(0.0);
  });

  it('should have correct name', async () => {
    const result = await <name>({
      output: 'test',
      expected: 'test',
    });
    expect(result.name).toBe('<name>');
  });
});
```

### Export Update (`packages/core/src/scorer/index.ts`)

```typescript
export { <name> } from './<name>';
```

## Examples

**Create exactMatch scorer:**

```
/add-scorer exactMatch --description "Checks if output exactly matches expected"
```

**Create fuzzyMatch scorer:**

```
/add-scorer fuzzyMatch --description "Calculates similarity score between strings"
```

## Checklist

- [ ] Scorer file created at correct location
- [ ] Test file created and co-located
- [ ] Export added to barrel file
- [ ] Types pass (`pnpm --filter @viteval/core types`)
- [ ] Tests pass (`pnpm --filter @viteval/core test`)

## Related

- **For autonomous component creation:** Use the `component-creator` agent
- **To run evaluations with the scorer:** Use `/eval` skill or `eval-tester` agent
