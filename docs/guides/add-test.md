# Add a Test

Write tests for Viteval code.

## Prerequisites

- Local environment set up (see [Setup Local Environment](./setup-local-env.md))
- Source file to test already exists
- Understanding of expected behavior

## Steps

### 1. Create test file

Create `{filename}.test.ts` next to the source file:

```
src/scorer/
├── custom.ts
└── custom.test.ts
```

### 2. (Optional) Add setup and teardown

```ts
describe('with setup', () => {
  beforeAll(async () => {
    await setup();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('should work', async () => {
    // test
  });
});
```

### 3. Write the test

```ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './my-function';

describe('myFunction', () => {
  it('should return expected result', async () => {
    const result = await myFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle edge case', async () => {
    const result = await myFunction('');
    expect(result).toBeNull();
  });
});
```

### 4. (Optional) Add mocks

```ts
import { describe, it, expect, vi } from 'vitest';

const mockFn = vi.fn().mockReturnValue('mocked');

vi.mock('@viteval/internal', () => ({
  hasKey: vi.fn().mockReturnValue(true),
}));

expect(mockFn).toHaveBeenCalledWith('arg');
```

### 5. Run the test

```bash
pnpm test
```

## Verification

Run tests and check for passing status:

```bash
pnpm test
```

Expected output shows all tests passing:

```
✓ src/my-feature/my-feature.test.ts (2 tests)
```

Run with coverage to verify test coverage:

```bash
pnpm test -- --coverage
```

## Troubleshooting

### Test file not discovered

**Issue:** Vitest doesn't find your test file.

**Fix:** Ensure the file follows the naming convention `*.test.ts`:

```bash
mv my-feature.spec.ts my-feature.test.ts
```

### Module not found errors

**Issue:** Test can't import the module being tested.

**Fix:** Check the import path is correct relative to the test file:

```ts
// If test is in src/feature/feature.test.ts
import { feature } from './feature'; // Not '../feature' or './src/feature'
```

### Async test timeout

**Issue:** Test times out waiting for async operation.

**Fix:** Increase timeout or check for unresolved promises:

```ts
it('should complete async operation', async () => {
  const result = await myAsyncFunction();
  expect(result).toBeDefined();
}, 10000); // 10 second timeout
```

## References

- [Testing Standards](../standards/testing.md) - Testing patterns
- [Add a Mock](./add-mock.md) - Using mocks in tests
