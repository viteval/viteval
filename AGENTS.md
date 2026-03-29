# Viteval

LLM evaluation framework built on Vitest.

IMPORTANT: Read the relevant `contributing/` docs before performing any task.

## Quick Reference

| Task     | Command         |
| -------- | --------------- |
| Build    | `pnpm build`    |
| Test     | `pnpm test`     |
| Validate | `pnpm validate` |
| Fix lint | `pnpm fix`      |

## Stack

- **Runtime:** Node >= 22, pnpm >= 10
- **Build:** Nx 22 (monorepo) + tsdown (bundler)
- **Lint/Format:** oxlint + oxfmt
- **Types:** TypeScript ~5.9 (strict mode)
- **Test:** Vitest 4

## Structure

```
viteval/
├── packages/       # Core packages
│   ├── core/       # evaluate(), createScorer(), defineDataset()
│   ├── cli/        # CLI (viteval run, init, data, ui)
│   ├── internal/   # Shared utils (not published)
│   ├── ui/         # React dashboard
│   └── viteval/    # Public entry point (re-exports core + cli)
├── apps/website/   # Docs site (Vitepress)
├── examples/       # Example projects
├── tools/core/     # Nx generators (pnpm gen)
└── contributing/   # Contributor documentation
```

## Imports & Modules

- **Intra-package:** `#/` path alias (e.g., `import { foo } from '#/internals/config'`)
- **Cross-package:** `@viteval/core`, `@viteval/internal`, etc.
- **Vitest:** Always `import { describe, it, expect } from 'vitest'`
- **Import order:** Node built-ins → external packages → `@viteval/*` → relative (`#/`)
- **Utilities:** Prefer `es-toolkit` over hand-rolled helpers

## Naming

- **Files:** kebab-case (`user-service.ts`, `eval-runner.test.ts`)
- **Variables & functions:** camelCase
- **Constants:** SCREAMING_SNAKE_CASE
- **Types/Interfaces:** PascalCase
- **Parameter interfaces:** `*Params` (required), `*Options` (optional)

## TypeScript

- **No `any`** — use `unknown` and narrow with type guards
- **Discriminated unions** for variant types (use `type` or `kind` discriminator)
- **Branded types** for type-safe IDs
- **`as const`** for literal types and readonly arrays
- **Use type-fest** for complex type utilities (`SetRequired`, `Simplify`, `Except`, etc.)

## Functions

- **Object params** when 2+ parameters (define `*Params` interface, destructure in signature)
- **JSDoc required** on all exported functions (`@param`, `@returns`, `@example`)
- **Pure functions preferred** — isolate side effects at edges
- **Early returns** for guard clauses (max 1-2 nesting levels)
- **Composition** over inheritance; **factories** over classes

## Error Handling

- **Result pattern** (`ok(value)` / `err(error)`) for expected failures
- **Domain-specific error types** — not generic `Error`
- **Never throw** in Result-returning functions
- Use `ts-pattern` with `.exhaustive()` for 2+ branches

## State

- **Immutable by default** — return new state, don't mutate
- **Factories with closures** to encapsulate state (not classes)
- **Derive, don't duplicate** — compute values from source state

## File Layout

1. Imports (grouped per import order above)
2. Types & interfaces
3. Constants
4. Exported functions (public API)
5. Private functions (bottom — hoisted)

## Testing

- **Co-located:** `feature.ts` → `feature.test.ts`
- **BDD style:** `describe('functionName', () => { it('should ...') })`
- **Mocks:** `vi.mock()` for modules, `vi.fn()` for functions, reset in `beforeEach()`
- **Async:** Use `async`/`await`, test errors with `rejects.toThrow()`

## Git Commits

```
type(scope): description
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `security`

- Lowercase, present tense, under 72 chars, no period
- Breaking changes: `feat(scope)!:` + `BREAKING CHANGE:` footer
- Each commit = one atomic, revertable change

## Lint Rules (will fail CI)

`no-explicit-any` · `no-console` · `eqeqeq` · `no-var` · `no-unused-vars`

## Further Reading

- [Architecture](./contributing/architecture.md) — package relationships and design
- [Patterns](./contributing/patterns.md) — code patterns and conventions
- [Standards](./contributing/standards.md) — full TypeScript and development standards
- [Guides](./contributing/guides/) — step-by-step instructions for common tasks
