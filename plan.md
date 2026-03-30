# Viteval Runner Modernization Plan

## Problem Statement

Viteval's Vitest integration relies on several brittle hacks that break across version bumps and make the system hard to reason about:

1. **Data smuggling via `suite.meta.results`** with `@ts-expect-error` — no type safety, fragile 3-way fallback in the reporter
2. **`DangerouslyAllowAny` throughout the reporter** — using deprecated `onFinished(files)` API instead of v4's typed granular hooks
3. **`globalThis.__model` / `__embeddingModel`** — invisible side-effect state for non-serializable AI SDK models
4. **`as any` casts in `defineConfig`** — type mismatches papered over between viteval and Vitest config surfaces
5. **No custom runner** — all orchestration crammed into `evaluate()`, mixing DSL declaration with execution logic
6. **No structured data channel** — eval results piggyback on test infrastructure with no first-class concept of "eval output"

We're already on Vitest 4.1.2 but using none of its new extensibility. This plan migrates to v4's proper APIs across 4 phases.

---

## Phase 1: Type Foundation & Meta Cleanup

**Goal:** Eliminate all `@ts-expect-error` and `DangerouslyAllowAny` without changing behavior.

### 1.1 Module-augment `TaskMeta`

**File:** `packages/core/src/types.ts` (or new `packages/core/src/vitest.d.ts`)

```ts
declare module 'vitest' {
  interface TaskMeta {
    results?: EvalResult[]
  }
}
```

**Impact:**
- `evaluate.ts:73` — remove `@ts-expect-error`, `suite.meta.results = results` becomes type-safe
- `json.ts` — `file.meta?.results` is now typed as `EvalResult[] | undefined`

### 1.2 Move to per-test metadata (instead of suite-level)

Instead of accumulating results in a closure and dumping them in `afterAll`, store each result on its own test's meta:

```ts
// Before (suite-level, fragile)
afterAll(({}, { suite }) => {
  suite.meta.results = results;
});

// After (per-test, robust)
test(name, async ({ task }) => {
  // ... run task + scorers ...
  task.meta.evalResult = result;
});
```

Augment `TaskMeta` accordingly:

```ts
declare module 'vitest' {
  interface TaskMeta {
    evalResult?: EvalResult    // per-test
    results?: EvalResult[]     // keep for backward compat during migration
  }
}
```

**Impact:**
- Eliminates the 3-way fallback in `extractEvalResults` — each test carries its own result
- Removes the mutable `results: EvalResult[]` closure + `afterAll` hack
- Reporter iterates test cases, reads `testCase.meta().evalResult`

### 1.3 Fix `defineConfig` type casts

**File:** `packages/core/src/config/types.ts`

Align `VitevalConfig` types with Vitest 4's actual config surface:
- `server` property — use Vitest 4's `ServerOptions` type (or narrow to the subset we expose)
- `plugins` property — use `Vite.Plugin[]` from `vite`

**Impact:**
- Remove `as any` casts at `define.ts:34,52`

### Deliverables

| File | Change |
|------|--------|
| `packages/core/src/vitest.d.ts` | New — `TaskMeta` augmentation |
| `packages/core/src/evaluate/evaluate.ts` | Per-test meta instead of suite-level closure |
| `packages/core/src/config/types.ts` | Align types with Vitest 4 |
| `packages/core/src/config/define.ts` | Remove `as any` casts |
| `packages/core/src/reporters/json.ts` | Simplify `extractEvalResults` to use typed meta |

---

## Phase 2: Reporter Modernization

**Goal:** Replace the deprecated reporter with v4's granular, fully-typed lifecycle hooks.

### 2.1 Rewrite `JsonReporter` using v4 Reporter API

Replace `onFinished(files: DangerouslyAllowAny[])` with granular hooks:

```ts
import type { TestCase, TestSuite, TestModule } from 'vitest/node';

export default class JsonReporter {
  // Typed initialization
  onInit(vitest: Vitest) { ... }

  // Stream results as they arrive (not batch at end)
  onTestCaseResult(testCase: TestCase) {
    const evalResult = testCase.meta().evalResult;
    if (!evalResult) return; // regular test, not an eval
    this.addResult(testCase, evalResult);
  }

  // Suite-level aggregation
  onTestSuiteResult(testSuite: TestSuite) {
    this.finalizeSuite(testSuite);
  }

  // Module completion — write incremental output
  onTestModuleEnd(testModule: TestModule) {
    this.writeResults();
  }

  // Final output with summary
  onTestRunEnd(testModules: ReadonlyArray<TestModule>, errors, reason) {
    this.finalize(reason);
    this.writeResults();
  }
}
```

**Impact:**
- Zero `DangerouslyAllowAny` — all types come from `vitest/node`
- Streaming results — file updates after each module, not just at the end
- `reason` parameter tells us if the run was interrupted vs failed vs passed
- Access to `testCase.fullName`, `testCase.result()`, `testCase.parent` etc.

### 2.2 Add annotation support for rich eval output

Use `context.annotate()` inside `evaluate()` for per-test score reporting:

```ts
test(name, async ({ task, annotate }) => {
  // ... run scorers ...
  for (const score of scores) {
    await annotate(`${score.name}: ${score.score}`, score.score >= threshold ? 'notice' : 'warning');
  }
});
```

Reporter picks these up via `onTestCaseAnnotate(testCase, annotation)` — enables:
- GitHub Actions integration (annotations show as PR annotations)
- Default reporter shows score breakdown on failures
- Custom reporters can consume structured score data

### 2.3 Extend reporter types in `VitevalConfig`

Currently `VitevalReporter = 'default' | 'json' | 'file'`. Extend to accept:
- Vitest v4 reporter instances directly
- Custom reporter classes/factories

```ts
type VitevalReporter = 'default' | 'json' | 'file' | Reporter;
```

### Deliverables

| File | Change |
|------|--------|
| `packages/core/src/reporters/json.ts` | Full rewrite — v4 granular hooks, typed, streaming |
| `packages/core/src/evaluate/evaluate.ts` | Add `annotate()` calls for score reporting |
| `packages/core/src/config/types.ts` | Extend `VitevalReporter` type |
| `packages/cli/src/commands/run.ts` | Update reporter construction for new API |
| `packages/core/src/reporters/json.test.ts` | New/updated tests |

---

## Phase 3: Custom Runner

**Goal:** Move evaluation orchestration from `evaluate()` into a proper Vitest runner, making `evaluate()` a pure declaration DSL.

### 3.1 Create `VitevalRunner`

**File:** `packages/core/src/runner/viteval-runner.ts`

Extends `VitestTestRunner` from `vitest/runners`:

```ts
import { VitestTestRunner } from 'vitest/runners';

export default class VitevalRunner extends VitestTestRunner {
  // Inject eval context (config, model refs) into every test
  extendTaskContext(context: TestContext): TestContext {
    return {
      ...context,
      evalConfig: this.getEvalConfig(),
      model: this.getModel(),
    };
  }

  // Per-test lifecycle — could add timing, tracing
  onBeforeRunTask(test: Test) {
    // Mark eval start time, set up tracing
  }

  onAfterRunTask(test: Test) {
    // Persist results to provider if configured
  }

  // Per-suite lifecycle
  onAfterRunSuite(suite: Suite) {
    // Suite-level aggregation, provider persistence
  }
}
```

### 3.2 Simplify `evaluate()` to pure DSL

With the runner handling lifecycle, `evaluate()` becomes declarative:

```ts
export function evaluate<...>(name: string, config: Eval<DATA>) {
  return describe(name, async () => {
    const data = await formatData(config.data);

    for (const item of data) {
      test(formatTestName(item), async ({ task, annotate, evalConfig }) => {
        const output = await config.task({ ...item });
        const scores = await runScorers(config.scorers, { ...item, output });

        // Store result on task meta (runner picks this up in onAfterRunTask)
        task.meta.evalResult = buildResult(item, scores, config);

        // Annotate for rich reporting
        for (const score of scores) {
          await annotate(`${score.name}: ${score.score}`);
        }

        // Threshold assertion
        assertThreshold(scores, config);
      });
    }
  });
}
```

**What moves to the runner:**
- `beforeAll` provider initialization -> `onBeforeRunFiles` or `extendTaskContext`
- `afterAll` result collection -> eliminated (per-test meta)
- Provider auto-persist -> `onAfterRunTask`

**What stays in `evaluate()`:**
- Data formatting and iteration
- Test declaration
- Scorer execution (test-scoped)
- Threshold assertion

### 3.3 Eliminate `globalThis` for models

The runner's `extendTaskContext` can inject model references directly into the test context since the runner runs in the same thread as tests:

```ts
// In runner
extendTaskContext(context) {
  return { ...context, __model: this.model, __embeddingModel: this.embeddingModel };
}
```

Or use `injectValue` for provide/inject:

```ts
// In runner
injectValue(key: string) {
  if (key === 'model') return this.model;
  if (key === 'embeddingModel') return this.embeddingModel;
}
```

Note: Since the runner runs in the same worker thread as tests, non-serializable values work here — no MessagePort limitation.

### 3.4 Wire runner in config

```ts
// defineConfig
return defineVitestConfig({
  test: {
    runner: require.resolve('@viteval/core/runner'),
    // ...
  }
});
```

### Deliverables

| File | Change |
|------|--------|
| `packages/core/src/runner/viteval-runner.ts` | New — custom Vitest runner |
| `packages/core/src/runner/index.ts` | New — barrel export |
| `packages/core/src/evaluate/evaluate.ts` | Simplify to pure DSL |
| `packages/core/src/config/define.ts` | Wire `runner` option, remove eager `initializeProvider` |
| `packages/core/src/provider/initialize.ts` | Move initialization to runner lifecycle |
| `packages/core/src/provider/client.ts` | Access model from context instead of globalThis |
| `packages/core/src/global.d.ts` | Remove globalThis declarations (or deprecate) |
| `packages/core/tsdown.config.ts` | Add runner entry point |
| `packages/core/package.json` | Add `./runner` export |

---

## Phase 4: Plugin & Config Cleanup

**Goal:** Use Vitest's plugin system for proper config injection. Clean up the seams.

### 4.1 Create `vitevalPlugin`

A Vite plugin with `configureVitest` hook:

```ts
export function vitevalPlugin(config: VitevalConfig): Vite.Plugin {
  return {
    name: 'viteval',
    configureVitest({ vitest, project }) {
      // Inject eval-specific config into the project
      vitest.config.testTimeout = config.eval?.timeout ?? 100_000;

      // Register the custom runner
      project.config.runner = resolve('@viteval/core/runner');

      // Provide serializable config
      vitest.provide('vitevalConfig', config.serializable());
    }
  };
}
```

### 4.2 Simplify `defineConfig`

With the plugin handling Vitest-level config:

```ts
export function defineConfig(config: VitevalConfig) {
  return defineVitestConfig({
    plugins: [vitevalPlugin(config), ...(config.plugins ?? [])],
    resolve: config.resolve,
    test: {
      include: config.eval?.include,
      exclude: config.eval?.exclude,
      setupFiles: config.eval?.setupFiles,
    },
  });
}
```

No more `as any`, no more manual `provide`, no more type gymnastics.

### 4.3 Custom eval task type via `createTaskCollector`

Tracked separately: [#121](https://github.com/viteval/viteval/issues/121) — explore whether `TestRunner.createTaskCollector()` is worth the complexity vs the current describe/test mapping.

### Deliverables

| File | Change |
|------|--------|
| `packages/core/src/plugin/viteval-plugin.ts` | New — Vite plugin with `configureVitest` |
| `packages/core/src/plugin/index.ts` | New — barrel export |
| `packages/core/src/config/define.ts` | Simplify to plugin-based |
| `packages/core/src/config/types.ts` | Clean up — remove Vitest internal types |

---

## Agent Team Structure

### Team: `runner-modernization`

#### Agent 1: `types-and-meta` (Phase 1)

**Scope:** Type foundation work — no behavior changes, just type safety.

- Add `vitest.d.ts` with `TaskMeta` augmentation
- Update `evaluate.ts` to use per-test `task.meta.evalResult`
- Fix `VitevalConfig` types to align with Vitest 4
- Remove all `@ts-expect-error` on meta access
- Remove `as any` casts in `define.ts`
- Run `pnpm validate` to confirm no regressions

**Dependencies:** None
**Risk:** Low — purely additive type changes + straightforward refactor

#### Agent 2: `reporter-rewrite` (Phase 2)

**Scope:** Full reporter rewrite using v4 APIs.

- Rewrite `JsonReporter` with granular v4 hooks (`onTestCaseResult`, `onTestSuiteResult`, `onTestRunEnd`)
- Import types from `vitest/node` instead of `vitest/reporters`
- Add streaming output (write after each module)
- Add `annotate()` calls in `evaluate.ts` for score reporting
- Update `run.ts` reporter construction
- Write/update reporter tests

**Dependencies:** Phase 1 must be complete (needs `TaskMeta` augmentation + per-test meta)
**Risk:** Medium — reporter is user-facing output, needs thorough testing

#### Agent 3: `custom-runner` (Phase 3)

**Scope:** Custom Vitest runner implementation.

- Create `VitevalRunner` extending `VitestTestRunner`
- Implement `extendTaskContext` for model/config injection
- Implement `onAfterRunTask` for provider persistence
- Simplify `evaluate()` to pure DSL
- Migrate `globalThis` model storage to runner context
- Wire runner in `defineConfig`
- Add runner entry point to package exports
- Write runner tests

**Dependencies:** Phase 1 must be complete. Can run in parallel with Agent 2 if both branch from Phase 1.
**Risk:** High — changes execution model. Needs integration testing with real evals.

#### Agent 4: `plugin-and-cleanup` (Phase 4)

**Scope:** Plugin system + final cleanup.

- Create `vitevalPlugin` with `configureVitest` hook
- Simplify `defineConfig` to use plugin
- Clean up config types
- Explore `createTaskCollector` for custom eval task type
- Remove dead code (old globalThis declarations, backward compat)
- Final `pnpm validate` + integration test pass

**Dependencies:** Phases 1-3 complete
**Risk:** Medium — config pipeline change, but well-isolated

---

## Execution Strategy

```
Phase 1 (types-and-meta)
  |
  +---> Phase 2 (reporter-rewrite)  \
  |                                   +---> Phase 4 (plugin-and-cleanup)
  +---> Phase 3 (custom-runner)      /
```

- **Phase 1** is sequential — everything depends on it
- **Phases 2 and 3** can run in parallel (reporter and runner are independent concerns)
- **Phase 4** is sequential — needs both 2 and 3 complete

### Validation Gates

Each phase must pass before the next begins:

1. **Phase 1 gate:** `pnpm validate` passes, zero `@ts-expect-error` on meta, zero `DangerouslyAllowAny` in types
2. **Phase 2 gate:** `pnpm validate` passes, JSON reporter produces identical output to current (snapshot test), annotations appear in default reporter
3. **Phase 3 gate:** `pnpm validate` passes, `evaluate()` works without `globalThis`, runner lifecycle hooks fire correctly
4. **Phase 4 gate:** `pnpm validate` passes, `defineConfig` has zero `as any` casts, plugin registers correctly

### Risk Mitigation

- **Each phase is independently shippable.** If Phase 3 proves too risky, Phases 1+2 still deliver massive value.
- **Phase 3 preserves backward compat.** The runner is opt-in via config; `globalThis` fallback remains until Phase 4 removes it.
- **Snapshot tests for reporter output.** Before rewriting the reporter, capture current JSON output as test fixtures. New reporter must produce equivalent output.

---

## What This Unlocks

After all 4 phases:

| Before | After |
|--------|-------|
| `@ts-expect-error` on every meta access | Fully typed `TaskMeta` augmentation |
| `DangerouslyAllowAny` throughout reporter | Typed `TestCase`, `TestSuite`, `TestModule` from `vitest/node` |
| `globalThis.__model` side effects | Runner-injected context, same thread, no serialization |
| Batch result collection in `afterAll` | Per-test metadata, streaming to reporter |
| `as any` config casts | Plugin-based config with proper types |
| `evaluate()` = declaration + orchestration + lifecycle | `evaluate()` = pure DSL, runner = lifecycle, reporter = output |
| Reporter gets results at end | Reporter streams results as each test completes |
| Fragile 3-way meta extraction fallback | Single `testCase.meta().evalResult` access |
| No GitHub Actions integration | Annotations show as PR comments via built-in GA reporter |
