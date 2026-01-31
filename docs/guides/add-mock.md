# Add a Mock

Use mocks in tests to isolate code from dependencies.

## Prerequisites

- Test file already created (see [Add a Test](./add-test.md))
- Understanding of what dependency to mock
- Vitest installed in the package

## Steps

### 1. Import vi from vitest

```ts
import { describe, it, expect, vi } from 'vitest';
```

### 2. Create a mock function

```ts
const mockFn = vi.fn();

mockFn('arg1', 'arg2');

expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
```

### 3. Mock return values

```ts
const mockFn = vi.fn().mockReturnValue('mocked value');

const result = mockFn();
expect(result).toBe('mocked value');
```

### 4. Mock a module

```ts
vi.mock('@viteval/internal', () => ({
  hasKey: vi.fn().mockReturnValue(true),
  isObject: vi.fn().mockReturnValue(false),
}));
```

### 5. Mock async functions

```ts
const mockAsync = vi.fn().mockResolvedValue({ data: 'test' });

const result = await mockAsync();
expect(result).toEqual({ data: 'test' });
```

### 6. Reset mocks between tests

```ts
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Verification

Run the test to verify the mock is working:

```bash
pnpm test
```

Verify mock was called with expected arguments:

```ts
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith('expected-arg');
```

## Troubleshooting

### Mock not being used

**Issue:** The real implementation runs instead of the mock.

**Fix:** Ensure `vi.mock()` is called at the top of the file, before imports:

```ts
import { vi } from 'vitest';

vi.mock('@viteval/internal'); // Must be before importing the tested module

import { myFunction } from './my-function';
```

### Mock state leaking between tests

**Issue:** Tests pass individually but fail when run together.

**Fix:** Clear mocks between tests:

```ts
beforeEach(() => {
  vi.clearAllMocks();
});

// Or reset to initial implementation
afterEach(() => {
  vi.resetAllMocks();
});
```

### TypeScript errors with mock types

**Issue:** TypeScript complains about mock return types.

**Fix:** Use proper typing with `vi.fn()`:

```ts
const mockFn = vi.fn<[string], number>().mockReturnValue(42);
```

## References

- [Add a Test](./add-test.md) - Writing tests
- [Vitest Mocking](https://vitest.dev/guide/mocking.html)
