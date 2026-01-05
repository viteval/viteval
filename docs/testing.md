# Testing

How tests are written in the Viteval codebase.

## Overview

| Setting | Value |
|---------|-------|
| Framework | Vitest |
| Style | BDD (describe/it/expect) |
| Location | Co-located (`*.test.ts`) |

## Patterns

### Co-location

Tests live next to the code they test:

```
src/scorer/
├── custom.ts
└── custom.test.ts
```

### BDD style

Use `describe` for grouping and `it` for test cases:

```ts
describe('myFunction', () => {
  it('should do something', () => {
    expect(result).toBe(expected)
  })
})
```

### Imports

Global variables are not supported, you must import test utilities from Vitest:

```ts
import { describe, it, expect, vi } from 'vitest'
```

## References

- [Add a Test](./guides/add-test.md) - A guide on how to write tests
