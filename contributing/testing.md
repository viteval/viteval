# Testing

How tests are written in the Viteval codebase.

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
    expect(result).toBe(expected);
  });
});
```

### Imports

Global variables are not supported, you must import test utilities from Vitest:

```ts
import { describe, it, expect, vi } from 'vitest';
```

## Production coverage

Run `pnpm test:coverage` from the repository root. The final merged report checks
100% statements, branches, functions, and lines for every handwritten production
file in core, CLI, providers, internal utilities, and the public package.
UI coverage is collected and reported, but does not block this gate.
Untested source files are included. Examples, generated files, declarations,
test support, documentation, and build tooling are not production coverage targets.

CLI subprocesses are attached to the V8 collector. Evaluation fixtures also use
`createCoverageArguments()` so their Vitest workers contribute coverage blobs.
Package unit reports and worker reports merge into
`packages/viteval/coverage/repository/index.html` before thresholds are checked.
The merge preserves every original source instrumentation slot and combines hits
only at matching source locations; transpiler-generated slots do not replace the
source inventory. Instrumented evaluator fixtures import its original source,
while ordinary validation and packed-consumer tests exercise built exports.
PostgreSQL coverage requires `VITEVAL_TEST_POSTGRES_URL` pointing to a disposable
PostgreSQL instance whose user can create databases. The contract tests create
and remove isolated databases; never point this variable at a production server.
CI supplies PostgreSQL 18 through a service container.
Do not run coverage, native-binary tests, or full validation concurrently: they
exercise shared CLI fixtures and can invalidate one another's results.

Test behavior and error recovery, not just execution. Use real files and SQLite
for storage behavior, and intercept outbound SDK/network boundaries when testing
orchestration. Do not add ignore directives or exclude production branches to
reach the coverage target. V1 is the only supported data and API contract.

## References

- [Add a Test](./guides/add-test.md) - A guide on how to write tests
