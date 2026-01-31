# Function Patterns

Standards for writing functions in the Viteval codebase.

## Overview

Functions are the primary building blocks of the codebase. This standard defines conventions for parameters, return types, overloads, and when to use object parameters versus positional arguments.

## Rules

### Parameter Naming and Typing

| Rule                       | Description                                   | Example                        |
| -------------------------- | --------------------------------------------- | ------------------------------ |
| Descriptive names          | Name parameters for their purpose             | `config`, `options`, `payload` |
| Avoid abbreviations        | Use full words unless widely understood       | `configuration` not `cfg`      |
| Type all parameters        | Always provide explicit types for parameters  | `(name: string)`               |
| Use interfaces for objects | Define named interfaces for object parameters | `(config: ScorerConfig)`       |

### Return Types

| Scenario                   | Annotation                         |
| -------------------------- | ---------------------------------- |
| Public API functions       | Always explicit                    |
| Internal helpers           | Inferred unless complex            |
| Generic functions          | Explicit to help inference         |
| Functions returning `void` | Explicit `void` or `Promise<void>` |

### Object Parameters

Use object parameters when:

- Function has 2 or more parameters
- Parameters are optional
- Function may gain parameters in the future
- Caller benefits from named arguments

```ts
// Good - object parameter for multiple args
function createScorer(config: ScorerConfig): Scorer {
  // ...
}

// Good - single required argument is fine
function formatTestName(dataItem: DataItem): string {
  // ...
}
```

## Examples

### Good

```ts
// Object parameter with typed interface
interface ScorerConfig<OUTPUT, EXTRA extends Extra = Extra> {
  name: string;
  score: (
    args: ScorerArgs<OUTPUT, EXTRA>
  ) => ScoreResult | Promise<ScoreResult>;
}

function createScorer<OUTPUT, EXTRA extends Extra = Extra>(
  config: ScorerConfig<OUTPUT, EXTRA>
): Scorer<OUTPUT, EXTRA> {
  return async (args: ScorerArgs<OUTPUT, EXTRA>) => {
    const result = await config.score(args);
    return {
      name: config.name,
      score: result.score,
      metadata: result.metadata,
    };
  };
}

// Explicit return type for public API
export function defineDataset<DATA_FUNC extends DataGenerator>(
  config: DatasetConfig<DATA_FUNC>
): Dataset<DATA_FUNC> {
  // ...
}

// Options object with defaults via destructuring
export function evaluate<DATA extends Data>(
  name: string,
  {
    data,
    aggregation = 'mean',
    task,
    scorers,
    threshold = 1.0,
    timeout,
  }: Eval<DATA>
) {
  // ...
}

// Type guard function with boolean return
function isDataset(
  data: Data<DataItem>
): data is Dataset<DataGenerator<DataItem>> {
  return isObject(data) && hasKey(data, 'load');
}

// Async function with explicit Promise return
async function load(): Promise<DataItem[] | null> {
  // ...
}

// Generic function with constrained type parameter
function isArray<T extends Array<unknown>>(value: unknown): value is T {
  return Array.isArray(value);
}
```

### Bad

```ts
// Bad - multiple positional parameters
function createStorage(name: string, root: string, storage: DatasetStorage) {
  // Should use object parameter
}

// Bad - no return type on public function
export function defineDataset(config) {
  // Missing parameter and return types
}

// Bad - abbreviated parameter names
function create(cfg, opts, cb) {
  // Use config, options, callback
}

// Bad - any type
function parse(input: any): Config {
  return input;
}

// Bad - inline object type instead of interface
function create(config: { name: string; value: number }): void {
  // Define an interface instead
}

// Bad - optional positional parameters
function format(input: string, prefix?: string, suffix?: string): string {
  // Hard to call: format(input, undefined, 'suffix')
  // Use object parameter instead
}
```

### Function Overloads

Use overloads when a function has distinct call signatures with different return types:

```ts
// Good - overloads for different behaviors based on options
interface Dataset {
  load(options: { create: true }): Promise<DataItem[]>;
  load(options: { create: false }): Promise<DataItem[] | null>;
  load(options?: { create?: boolean }): Promise<DataItem[] | null>;
}

// Implementation handles all cases
async load(options) {
  if (options?.create === true && !data) {
    // Create and return guaranteed data
    return newData;
  }
  return data; // May be null
}
```

Avoid overloads when a union return type is clearer:

```ts
// Prefer union over overload when behavior doesn't differ
function parse(input: string | Buffer): Config {
  // Same logic for both input types
}
```

## Generic Functions

### Type Parameter Naming

| Convention | Usage                           |
| ---------- | ------------------------------- |
| `T`        | Single generic type             |
| `INPUT`    | Descriptive for domain concepts |
| `OUTPUT`   | Descriptive for domain concepts |
| `DATA`     | Descriptive for collections     |

```ts
// Good - descriptive type parameters
function createScorer<OUTPUT, EXTRA extends Extra = Extra>(
  config: ScorerConfig<OUTPUT, EXTRA>
): Scorer<OUTPUT, EXTRA>;

// Good - T for simple cases
function isArray<T extends Array<unknown>>(value: unknown): value is T;
```

### Constraints

Use constraints to ensure type parameters have required properties:

```ts
// Constrain to ensure EXTRA has correct shape
function createScorer<OUTPUT, EXTRA extends Extra = Extra>(
  config: ScorerConfig<OUTPUT, EXTRA>
): Scorer<OUTPUT, EXTRA>;

// Constrain to Error for error types
async function withResult<OK, ERROR extends Error = Error>(
  fn: (() => Promise<OK>) | (() => OK)
): Promise<Result<OK, ERROR>>;
```

## Best Practices

### Do

- Use object parameters for functions with 2+ arguments
- Define interfaces for object parameters
- Provide explicit return types for public API functions
- Use descriptive type parameter names for domain concepts
- Use function overloads when return type depends on input
- Destructure options with default values in the signature
- Export types alongside functions when part of public API

### Don't

- Use positional parameters when order is not obvious
- Abbreviate parameter names (`cfg`, `opts`, `cb`)
- Use `any` for parameter or return types
- Create overloads when a union type would be clearer
- Define inline object types in function signatures
- Use single-letter type parameters for complex generics

## Enforcement

- TypeScript strict mode enforces parameter typing
- Code review ensures naming conventions
- Prefer interfaces exported from types files

## References

- [TypeScript Standards Overview](./overview.md)
- [Naming Conventions](./naming.md)
- [Error Handling](./errors.md)
