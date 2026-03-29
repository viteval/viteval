# Standards

Detailed TypeScript and development standards for viteval. For the quick version, see [AGENTS.md](../AGENTS.md).

## TypeScript

### Types

- Never use `any` — use `unknown` and narrow with type guards
- Use **discriminated unions** for variant types with a `type` or `kind` discriminator
- Use **branded types** for type-safe IDs to prevent primitive confusion
- Use **`as const`** for literal types and readonly arrays
- Use **type-fest** for advanced type utilities:
  - `SetRequired<T, K>`, `SetOptional<T, K>` — adjust optionality
  - `Simplify<T>` — flatten intersections for readability
  - `Except<T, K>` — better `Omit`
  - `PartialDeep<T>`, `ReadonlyDeep<T>` — deep modifiers
- Create custom **type guards** (`function isFoo(v: unknown): v is Foo`) for runtime narrowing
- Never use type assertions (`as`) without validation

### Functions

- **Object parameters** when a function has 2+ related params:
  1. Define a `*Params` interface (required) or `*Options` interface (optional config)
  2. Destructure in the function signature
  3. Document with JSDoc
- **JSDoc required** on all exported functions:
  - `@param` — describe the parameter object
  - `@returns` — describe the return value
  - `@example` — usage example
  - `@private` — for internal functions
- **Pure functions preferred**:
  - Same inputs → same outputs
  - No modification of external state
  - No I/O (logging, network, file system)
- Use **early returns** for guard clauses (max 1-2 levels of nesting)
- Use **function composition** — small, focused, composable functions

### Conditionals

- Use **ts-pattern** for 2+ conditional branches:
  - Always call `.exhaustive()` for compile-time safety
  - Use inferred types from callback parameters (never cast)
  - Match on shape directly, don't pre-categorize
- Use **ternary** only for single boolean conditions
- Use **early returns** for guard clauses
- Never use nested ternaries

### Error Handling

- Use the **Result pattern** (`ok(value)` / `err(error)`) for operations that can fail:
  - Expected failures: JSON parsing, validation, API calls, file I/O
  - Not for truly exceptional/unexpected errors
- Define **domain-specific error types** (not generic `Error`)
- Never throw in Result-returning functions
- Chain Results with early returns for clean flow
- Combine Result + ts-pattern for exhaustive error handling

### State

- **Immutable by default** — always create new state, never mutate
  - Spread: `[...items, newItem]`, `{ ...item, ...updates }`
  - Filter/map for removals and updates
- **Factories with closures** to encapsulate state (not classes):
  - No `this` confusion, no `new` keyword
  - Truly private state via closure
  - Easy to test, easy to create multiple instances
- **Derive, don't duplicate** — compute values from source state
- Memoize only when computation is genuinely expensive

### Paradigm

- **Functional over OOP**:
  - Data transformations over mutations
  - Functions over methods
  - Composition over inheritance
  - Explicit over implicit
  - Factories over classes
- **Classes only for**: true stateful resources (DB connections, SDK clients, WebSocket handlers) or framework requirements
- **Never use classes for**: utilities, static method collections, data containers, singletons

### Utilities

- **Always check es-toolkit first** before writing utility functions
- Common categories:
  - **Type guards**: `isNil`, `isNull`, `isUndefined`, `isString`, `isNumber`, `isPlainObject`
  - **Objects**: `pick`, `omit`, `mapValues`, `merge`, `clone`, `cloneDeep`
  - **Collections**: `groupBy`, `keyBy`, `chunk`, `uniq`, `uniqBy`, `compact`, `flatten`
  - **Functions**: `debounce`, `throttle`, `memoize`, `once`
  - **Strings**: `camelCase`, `kebabCase`, `snakeCase`, `capitalize`
- Don't use es-toolkit when inline is clearer (e.g., `x != null` vs `!isNil(x)`)

## File Structure

### Layout (top to bottom)

1. **Imports** — grouped with blank lines between groups:
   1. Node built-ins (`node:fs`, `node:path`)
   2. External packages (`es-toolkit`, `ts-pattern`)
   3. Internal packages (`@viteval/core`, `@viteval/internal`)
   4. Relative imports (`#/internals/config`, `./types`)
2. **Types** — type definitions, interfaces, schemas
3. **Constants** — module-level constants
4. **Exported functions** — public API (readers see first)
5. **Private functions** — bottom (hoisted via `function` declarations)

### Naming

- **Files**: kebab-case (`user-service.ts`, `eval-runner.ts`)
- **Special files**: `types.ts`, `constants.ts`, `schema.ts`, `utils.ts`, `config.ts`
- **Test files**: `*.test.ts` co-located with source
- No banner comments (`// --- Helpers ---`, `// === Public ===`)

## Testing

### Structure

- Co-locate tests: `feature.ts` → `feature.test.ts`
- Integration tests in `__tests__/` directory if needed
- BDD style: `describe('functionName')` → `it('should ...')`

### Mocking

- Mock modules: `vi.mock('module')`
- Mock functions: `vi.fn()`
- Reset in `beforeEach()` — never share mutable state between tests

### Async

- Mark tests `async`, use `await` for promises
- Test error cases: `expect(fn()).rejects.toThrow()`

### Coverage Targets

- Critical paths (auth, scoring): aim for 100%
- Business logic: 80%+
- Utilities: 70%+

### Anti-Patterns

- Testing implementation details instead of behavior
- Skipping tests without a reason
- Sharing mutable state between tests

## Git Commits

### Format

```
type(scope): description

[optional body — explain WHY, not WHAT]

[optional footer — Refs #123, BREAKING CHANGE:]
```

### Types

| Type       | Use                                    |
| ---------- | -------------------------------------- |
| `feat`     | New user-facing feature                |
| `fix`      | Bug fix                                |
| `docs`     | Documentation only                     |
| `refactor` | Code change, no behavior change        |
| `test`     | Add or update tests                    |
| `chore`    | Maintenance (build, deps, config)      |
| `perf`     | Performance optimization               |
| `security` | Security fix or vulnerability patch    |

### Rules

- Lowercase type and scope
- Present tense ("add" not "added")
- Under 72 characters
- No period at end
- Breaking changes: `feat(scope)!:` with `BREAKING CHANGE:` footer
- Each commit = one logical, atomic, independently revertable change
