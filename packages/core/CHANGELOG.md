# @viteval/core

## 0.5.0

### Patch Changes

- @viteval/internal@0.5.0

## 0.4.3

### Patch Changes

- 5ad0932: fixed issue with types for datasets
  - @viteval/internal@0.4.3

## 0.4.2

### Patch Changes

- a179bd1: stablize the datasets, add support for memory, and better CLI handling for datasets
  - @viteval/internal@0.4.2

## 0.4.1

### Patch Changes

- 71ee1af: fix issue with datasets on error
- Updated dependencies [71ee1af]
  - @viteval/internal@0.4.1

## 0.4.0

### Minor Changes

- 864c595: ## Viteval UI (beta)

  This release includes major improvements to the Viteval UI, including:
  - Adding a new `datasets` page to view and manage your evaluation datasets
  - Adding UI states to show when an evaluation is running and updating it as it runs/finishes
  - Cleaning up the UI for Results List and Result Detail pages
  - Adding better viewing experience for Result Detail page

### Patch Changes

- @viteval/internal@0.4.0

## 0.3.2

### Patch Changes

- 9db42c7: # What's changed?
  - Add a wrapper to prevent `resolveConfig` from throwing an error, and add logging for debugging.
  - Added a `createVitevalServer` for the `ui` that can be used in a more standard way/approach

- Updated dependencies [9db42c7]
  - @viteval/internal@0.3.2

## 0.3.1

### Patch Changes

- 94c3934: Add a wrapper to prevent `resolveConfig` from throwing an error, and add logging for debugging.
- Updated dependencies [94c3934]
  - @viteval/internal@0.3.1

## 0.2.0

### Minor Changes

- 8140eca: ## Eval Results UI (alpha)

  You can now view the results of your evals in a local UI that is built on top of the Viteval JSON File (`file`) reporter.

  To enable the UI, pass the `--ui` flag to the `viteval run` command.

  ```sh
  viteval run --ui
  ```

  The UI will be available at `http://localhost:3000`.

## 0.1.8

### Patch Changes

- b8a4e92: ## UI [alpha]

  You can now view the results of your evals in a local UI that is built on top of the Viteval JSON File (`file`) reporter.

  To enable the UI, pass the `--ui` flag to the `viteval run` command.

  ```sh
  viteval run --ui
  ```

  The UI will be available at `http://localhost:3000`.

  > [!CAUTION]
  > The UI is still in alpha and may not be fully functional, probably has a lot of bugs, and may have significant breaking changes in the future.

## 0.1.7

### Patch Changes

- ba9db56: ## Reporters

  You can now pass reporters to the CLI or in your config file. This allows you to output JSON to `stdout` as well as a file.

  Add to your config file:

  ```ts
  export default defineConfig({
    reporters: ["file"],
  });
  ```

  Or via the CLI:

  ```sh
  viteval run --reporters=file
  ```

  ### Multiple Reporters

  You can pass multiple reporters to the CLI or in your config file. This allows you to combine the default reporter with the file reporter to get the results in both formats.

  ```ts
  export default defineConfig({
    reporters: ["default", "file"],
  });
  ```

## 0.1.6

### Patch Changes

- 56cf589: fix: Add missing input for LLM scorers

## 0.1.5

### Patch Changes

- f42a1cc: fix: Allow `timeout` to be passed through root config & increate to 25s as default

## 0.1.4

### Patch Changes

- 4ddfa01: feat: Allow the `data` command to load the Viteval setup files and config

## 0.1.3

### Patch Changes

- 7e7bd69: feat: Add server configurations for the underlying Vitest node server
- d99658c: fix: Loosen config types

## 0.1.2

### Patch Changes

- 5d1186d: feat: Add in `deps` for configuring CJS deps and others
- ae4035e: chore: remove unneeded imports & cleanup

## 0.1.1

### Patch Changes

- 98365f5: fix: Fix the runner so it can find underlying lib

## 0.1.0

### Minor Changes

- 8c267d7: feat: Added `datasets` support for cacheing pre-generated datasets

### Patch Changes

- 62941f3: "feat: expose `createScorer` & general clean up"
- 1cc67b1: feat: Add `init` command
- Updated dependencies [8c267d7]
- Updated dependencies [62941f3]
  - @viteval/internal@0.0.4

## 0.0.3

### Patch Changes

- ce74986: feat: Add `resolve` config support and attempt to fix plugin support
  - @viteval/internal@0.0.3

## 0.0.2

### Patch Changes

- f9d3314: feat: Add support for `plugins`
  - @viteval/internal@0.0.2
