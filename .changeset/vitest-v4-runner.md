---
'@viteval/core': major
'@viteval/cli': patch
'viteval': major
---

Delegate configuration, discovery, execution, and reporting to Vitest 5's public APIs.

- **BREAKING**: Replace `viteval.config.ts` and the `eval` configuration block with native `vitest.config.ts` and `test` options.
- **BREAKING**: Remove the custom runner, plugin, runtime bootstrap, virtual config module, `createRun()` lifecycle, and `@viteval/core/runner` and `@viteval/core/plugin` exports.
- **BREAKING**: Delegate evaluation CLI parsing and lifecycle to Vitest, replace `Eval.timeout` with native `Eval.testOptions`, and remove `createDefaultReporter()` in favor of Vitest's built-in default reporter.
- **BREAKING**: Rewrite `JsonReporter` with Vitest's granular lifecycle hooks. Custom reporters extending the old `onFinished(files)` API must migrate.
- Execute evaluations through Vitest's native `start()` API.
- Transport structured eval results as typed Vitest custom artifacts.
- Initialize non-serializable models and providers through native Vitest setup files.
- Add a native custom reporter that uses evaluation terminology throughout.
- Add test annotations (`context.annotate`) for inline score reporting.
- Eliminate all `DangerouslyAllowAny` and `as any` casts from the core package.
