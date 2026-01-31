---
name: add-reporter
description: >-
  This skill should be used when the user wants to "create a reporter", "add new reporter",
  "custom test output", "add result reporter", or "scaffold reporter". Creates a new
  reporter component implementing the Vitest Reporter interface.
---

# Add Reporter

Create a new reporter component implementing the Vitest Reporter interface.

## Usage

`/add-reporter <name> [options]`

## Options

| Option          | Description                                                |
| --------------- | ---------------------------------------------------------- |
| `<name>`        | Name of the reporter (kebab-case, e.g., `console-summary`) |
| `--description` | Description for JSDoc                                      |

## Instructions

1. **Gather information:**
   - Reporter name (required, kebab-case)
   - Output format/destination (console, file, API, etc.)
   - What information to capture (scores, metadata, timing)

2. **Read existing patterns:**
   - Use Serena `find_symbol` to read existing reporters from `packages/core/src/reporters/`
   - Use Serena `get_symbols_overview` on `packages/core/src/reporters/json.ts` for Reporter implementation
   - Check Vitest Reporter interface for available hooks

3. **Generate the reporter file:**
   - Location: `packages/core/src/reporters/<name>.ts`
   - Follow the template pattern below

4. **Generate the test file:**
   - Location: `packages/core/src/reporters/<name>.test.ts`
   - Co-located with source file

5. **Update barrel exports:**
   - Add export to `packages/core/src/reporters/index.ts`

6. **Run validation:**
   - Execute `pnpm --filter @viteval/core types` to verify types
   - Execute `pnpm --filter @viteval/core test` to run tests

## Template

### Reporter File (`packages/core/src/reporters/<name>.ts`)

````typescript
import type { Reporter } from 'vitest/reporters';
import type { DangerouslyAllowAny } from '@viteval/internal';

/**
 * <Description of the reporter>
 *
 * @example
 * ```ts
 * // vitest.config.ts
 * export default defineConfig({
 *   test: {
 *     reporters: [
 *       'default',
 *       ['@viteval/core/reporters/<name>', { /* options */ }]
 *     ]
 *   }
 * });
 * ```
 */
export default class <PascalName>Reporter implements Reporter {
  private options: <PascalName>Options;

  constructor(options: <PascalName>Options = {}) {
    this.options = options;
  }

  onInit() {
    // Called when test run starts
  }

  onFinished(files: DangerouslyAllowAny[] = []) {
    // Called when all tests complete
    // Process files and output results
    for (const file of files) {
      // Extract eval results from file.meta or file.tasks
    }
  }
}

/**
 * Options for <PascalName>Reporter
 */
export interface <PascalName>Options {
  // Add configuration options here
}
````

### Test File (`packages/core/src/reporters/<name>.test.ts`)

```typescript
import { describe, expect, it } from 'vitest';
import <PascalName>Reporter from './<name>';

describe('<PascalName>Reporter', () => {
  it('should instantiate with default options', () => {
    const reporter = new <PascalName>Reporter();
    expect(reporter).toBeDefined();
  });

  it('should instantiate with custom options', () => {
    const reporter = new <PascalName>Reporter({
      // custom options
    });
    expect(reporter).toBeDefined();
  });

  it('should handle onInit', () => {
    const reporter = new <PascalName>Reporter();
    expect(() => reporter.onInit()).not.toThrow();
  });

  it('should handle onFinished with empty files', () => {
    const reporter = new <PascalName>Reporter();
    expect(() => reporter.onFinished([])).not.toThrow();
  });
});
```

### Export Update (`packages/core/src/reporters/index.ts`)

```typescript
export { default as <PascalName>Reporter } from './<name>';
export type { <PascalName>Options } from './<name>';
```

## Vitest Reporter Hooks

| Hook                      | When Called                |
| ------------------------- | -------------------------- |
| `onInit()`                | Test run starts            |
| `onPathsCollected(paths)` | Test files discovered      |
| `onCollected(files)`      | Tests collected from files |
| `onTaskUpdate(packs)`     | Test task status updates   |
| `onFinished(files)`       | All tests complete         |
| `onWatcherStart()`        | Watch mode starts          |
| `onWatcherRerun(files)`   | Watch mode reruns          |

## Examples

**Create a console summary reporter:**

```
/add-reporter console-summary --description "Outputs a brief summary to console"
```

**Create a webhook reporter:**

```
/add-reporter webhook --description "Posts results to a webhook URL"
```

## Checklist

- [ ] Reporter file created at correct location
- [ ] Test file created and co-located
- [ ] Export added to barrel file
- [ ] Implements Reporter interface correctly
- [ ] Types pass (`pnpm --filter @viteval/core types`)
- [ ] Tests pass (`pnpm --filter @viteval/core test`)

## Related

- **For autonomous component creation:** Use the `component-creator` agent
- **To run evaluations with the reporter:** Use `/eval` skill or `eval-tester` agent
