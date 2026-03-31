---
'@viteval/core': major
'@viteval/cli': patch
'viteval': major
---

Modernize Vitest integration with v4 runner, reporter, and plugin APIs

- **BREAKING**: `JsonReporter` rewritten with Vitest v4 granular lifecycle hooks (`onTestCaseResult`, `onTestRunEnd`). Custom reporters extending the old `onFinished(files)` API must migrate.
- Add custom `VitevalRunner` extending Vitest 4's `TestRunner` with `extendTaskContext` for lazy model injection
- Add `vitevalPlugin` with `configureVitest` hook for typed config injection via `ProvidedContext`
- Move from suite-level meta smuggling to per-test `task.meta.evalResult` with proper `TaskMeta` module augmentation
- Add test annotations (`context.annotate`) for inline score reporting in default and GitHub Actions reporters
- Eliminate all `DangerouslyAllowAny` and `as any` casts from core package
- New package exports: `@viteval/core/runner`, `@viteval/core/plugin`
