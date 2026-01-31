# Error Handling

Standards for handling errors in the Viteval codebase.

## Overview

Proper error handling is essential for building reliable software. This standard defines when to throw errors versus return them, how to structure error messages, and best practices for async error handling.

## Rules

### When to Throw vs Return

| Scenario                        | Approach        | Example                                       |
| ------------------------------- | --------------- | --------------------------------------------- |
| Invalid arguments               | Throw           | `throw new Error('Invalid config')`           |
| Unrecoverable state             | Throw           | `throw new Error('Database connection lost')` |
| Expected failure (file missing) | Return `null`   | `return data ?? null`                         |
| Recoverable operation           | Return `Result` | `return { status: 'error', result: error }`   |
| Assertion/type guard            | Throw           | `asserts value is string`                     |

### Error Types

Use built-in `Error` for most cases. Create custom errors only when callers need to distinguish error types:

```ts
// Good - standard Error with descriptive message
throw new Error(`Unsupported storage type: ${storage}`);

// Good - custom error when type distinction matters
class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}
```

### Error Messages

| Rule                    | Description                              |
| ----------------------- | ---------------------------------------- |
| Be specific             | Include actual values in messages        |
| Use template literals   | Interpolate variables for context        |
| Avoid generic messages  | "Error" or "Something went wrong" is bad |
| Include expected format | When validating input, show what's valid |

## Examples

### Good

```ts
// Return null for expected missing data
async function load(): Promise<DataItem[] | null> {
  if (!(await this.exists())) {
    return null;
  }
  const data = await readFile(filePath, 'utf-8');
  return JSON.parse(data).data;
}

// Throw for invalid arguments with context
function assertStorage(storage: DatasetStorage): asserts storage is 'local' {
  if (storage !== 'local') {
    throw new Error(`Unsupported storage type: ${storage}`);
  }
}

// Use Result type for operations that may fail
async function withResult<OK, ERROR extends Error = Error>(
  fn: (() => Promise<OK>) | (() => OK)
): Promise<Result<OK, ERROR>> {
  try {
    const fnResult = fn();
    const result = isPromise(fnResult) ? await fnResult : fnResult;
    return { status: 'ok', ok: true, result };
  } catch (error) {
    return { status: 'error', ok: false, result: error as ERROR };
  }
}

// Handle Result type properly
const R = await withResult(async () => {
  const data = await readFile(filePath, 'utf-8');
  return JSON.parse(data).data;
});

if (R.status === 'error') {
  throw R.result;
}

return R.result;
```

### Bad

```ts
// Bad - generic error message
throw new Error('Error');

// Bad - returning undefined instead of null
async function load(): Promise<DataItem[] | undefined> {
  if (!exists) {
    return undefined; // Use null for "intentionally empty"
  }
}

// Bad - swallowing errors silently
try {
  await doSomething();
} catch {
  // Silent failure - error is lost
}

// Bad - catching and re-throwing without context
try {
  await parseConfig(input);
} catch (error) {
  throw error; // Just let it propagate naturally
}

// Bad - using any for error type
catch (error: any) {
  console.log(error.message);
}
```

## Async Error Handling

### Promise Rejection

Always use `async/await` with try/catch rather than `.catch()`:

```ts
// Good
async function fetchData(): Promise<Data> {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch data: ${(error as Error).message}`);
  }
}

// Bad
function fetchData(): Promise<Data> {
  return fetch(url)
    .then((r) => r.json())
    .catch((e) => {
      throw e;
    });
}
```

### Parallel Operations

When running operations in parallel, handle errors appropriately:

```ts
// Good - let Promise.all fail fast on first error
const scores = await Promise.all(
  scorers.map((scorer) => scorer({ output, expected }))
);

// Good - collect all results when you need partial success
const results = await Promise.allSettled(
  items.map((item) => processItem(item))
);

const successes = results
  .filter((r) => r.status === 'fulfilled')
  .map((r) => r.value);
```

## Best Practices

### Do

- Use descriptive error messages with interpolated values
- Return `null` for expected empty/missing states
- Use `Result` type when callers need to handle both success and failure
- Let errors propagate naturally when you can't handle them
- Use assertion functions (`asserts x is T`) for type guards that throw
- Type narrow errors with `error as Error` when accessing properties

### Don't

- Catch errors just to re-throw them unchanged
- Use `any` type for caught errors
- Return `undefined` when `null` is more appropriate
- Swallow errors silently in catch blocks
- Use generic error messages like "Error" or "Failed"
- Mix `.then()/.catch()` with `async/await` in the same function

## Enforcement

- TypeScript strict mode catches many type-related error handling issues
- Code review ensures error messages are descriptive
- Prefer `Result` type from `@viteval/internal` for recoverable operations

## References

- [TypeScript Standards Overview](./overview.md)
- [Patterns](./patterns.md)
- [Result Type](../../../packages/internal/src/utils/result.ts)
