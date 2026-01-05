# Add a Feature

Add new functionality to an existing Viteval package.

## Steps

### 1. Identify the target package

| Feature Type | Package |
|--------------|---------|
| Evaluation logic | `@viteval/core` |
| Utilities | `@viteval/internal` |
| CLI commands | `@viteval/cli` |
| UI components | `@viteval/ui` |

### 2. Design the public API

Before coding, design what users will import and how they'll use it:

```ts
import { myFeature } from '@viteval/core'

const result = myFeature({ option: 'value' })
```

### 3. Create the feature directory

```bash
mkdir -p packages/core/src/my-feature
```

### 4. Create the implementation

```ts
// src/my-feature/my-feature.ts
export interface MyFeatureOptions {
  option: string
}

export function myFeature(options: MyFeatureOptions) {
  return { result: options.option }
}
```

### 5. Create the barrel export

```ts
// src/my-feature/index.ts
export { myFeature, type MyFeatureOptions } from './my-feature'
```

### 6. Export from the package

```ts
// src/index.ts
export { myFeature, type MyFeatureOptions } from './my-feature'
```

### 7. Write tests

```ts
// src/my-feature/my-feature.test.ts
import { describe, expect, it } from 'vitest'
import { myFeature } from './my-feature'

describe('myFeature', () => {
  it('should return result with option', () => {
    const result = myFeature({ option: 'test' })
    expect(result).toEqual({ result: 'test' })
  })
})
```

### 8. Add JSDoc documentation

```ts
/**
 * My feature does something useful.
 *
 * @example
 * ```ts
 * import { myFeature } from '@viteval/core'
 *
 * const result = myFeature({ option: 'value' })
 * ```
 */
export function myFeature(options: MyFeatureOptions) {
  // ...
}
```

### 9. Run validation

```bash
pnpm agents validate
```

## References

- [Commit Changes](./commit-changes.md) - Commit and push your changes
- [Publish Changes](./publish-changes.md) - Create a changeset for release
