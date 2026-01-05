# Add a Mock

Use mocks in tests to isolate code from dependencies.

## Steps

### 1. Import vi from vitest

```ts
import { describe, it, expect, vi } from 'vitest'
```

### 2. Create a mock function

```ts
const mockFn = vi.fn()

mockFn('arg1', 'arg2')

expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
```

### 3. Mock return values

```ts
const mockFn = vi.fn().mockReturnValue('mocked value')

const result = mockFn()
expect(result).toBe('mocked value')
```

### 4. Mock a module

```ts
vi.mock('@viteval/internal', () => ({
  hasKey: vi.fn().mockReturnValue(true),
  isObject: vi.fn().mockReturnValue(false),
}))
```

### 5. Mock async functions

```ts
const mockAsync = vi.fn().mockResolvedValue({ data: 'test' })

const result = await mockAsync()
expect(result).toEqual({ data: 'test' })
```

### 6. Reset mocks between tests

```ts
beforeEach(() => {
  vi.clearAllMocks()
})
```

## References

- [Add a Test](./add-test.md) - Writing tests
- [Vitest Mocking](https://vitest.dev/guide/mocking.html)
