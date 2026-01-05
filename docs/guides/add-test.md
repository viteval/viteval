# Add a Test

Write tests for Viteval code.

## Steps

### 1. Create test file

Create `{filename}.test.ts` next to the source file:

```
src/scorer/
├── custom.ts
└── custom.test.ts
```

### 2. Write the test

```ts
import { describe, it, expect } from 'vitest'
import { myFunction } from './my-function'

describe('myFunction', () => {
  it('should return expected result', async () => {
    const result = await myFunction('input')
    expect(result).toBe('expected')
  })

  it('should handle edge case', async () => {
    const result = await myFunction('')
    expect(result).toBeNull()
  })
})
```

### 3. Run the test

```bash
pnpm test
```

### 4. (Optional) Add setup and teardown

```ts
describe('with setup', () => {
  beforeAll(async () => {
    await setup()
  })

  afterAll(async () => {
    await cleanup()
  })

  it('should work', async () => {
    // test
  })
})
```

### 5. (Optional) Add mocks

```ts
import { describe, it, expect, vi } from 'vitest'

const mockFn = vi.fn().mockReturnValue('mocked')

vi.mock('@viteval/internal', () => ({
  hasKey: vi.fn().mockReturnValue(true),
}))

expect(mockFn).toHaveBeenCalledWith('arg')
```

## References

- [Testing Overview](../testing.md)
