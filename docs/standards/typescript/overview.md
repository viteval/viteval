# TypeScript Standards

Coding patterns and conventions for TypeScript in the Viteval monorepo.

## Standards

| Standard                   | Description                         |
| -------------------------- | ----------------------------------- |
| [Naming](./naming.md)      | File and variable naming            |
| [Patterns](./patterns.md)  | Import patterns and code structure  |

## Quick Reference

| Question                  | Answer                                              |
| ------------------------- | --------------------------------------------------- |
| How do I name a file?     | kebab-case, see [naming.md](./naming.md)            |
| How do I import files?    | Use `#/` alias, see [patterns.md](./patterns.md)    |
| Cross-package imports?    | Use package names, see [patterns.md](./patterns.md) |

## General Rules

### Strict Mode

TypeScript strict mode is enabled for all packages. Don't disable strict checks.

### Type Inference

Prefer type inference over explicit annotations when the type is obvious:

```ts
// Good - type inferred
const count = 0;
const items = ['a', 'b'];

// Good - explicit when needed
function createScorer(name: string): Scorer {
  // ...
}

// Bad - unnecessary annotation
const count: number = 0;
```

### Avoid `any`

Never use `any`. Use `unknown` with type guards instead:

```ts
// Good
function parse(input: unknown): Config {
  if (isConfig(input)) {
    return input;
  }
  throw new Error('Invalid config');
}

// Bad
function parse(input: any): Config {
  return input;
}
```

### Export Types

Export types alongside values when they're part of the public API:

```ts
export interface ScorerOptions {
  name: string;
  threshold?: number;
}

export function createScorer(options: ScorerOptions): Scorer {
  // ...
}
```

## References

- [Documentation Writing Standards](../documentation/writing.md)
- [Testing Standards](../testing.md)
