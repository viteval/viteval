# @viteval/cli

## 0.4.1

### Patch Changes

- 71ee1af: fix issue with datasets on error
- Updated dependencies [71ee1af]
  - @viteval/core@0.4.1
  - @viteval/internal@0.4.1
  - @viteval/ui@0.4.1

## 0.4.0

### Minor Changes

- 864c595: ## Viteval UI (beta)

  This release includes major improvements to the Viteval UI, including:
  - Adding a new `datasets` page to view and manage your evaluation datasets
  - Adding UI states to show when an evaluation is running and updating it as it runs/finishes
  - Cleaning up the UI for Results List and Result Detail pages
  - Adding better viewing experience for Result Detail page

### Patch Changes

- Updated dependencies [864c595]
  - @viteval/core@0.4.0
  - @viteval/ui@0.4.0
  - @viteval/internal@0.4.0

## 0.3.2

### Patch Changes

- 9db42c7: # What's changed?
  - Add a wrapper to prevent `resolveConfig` from throwing an error, and add logging for debugging.
  - Added a `createVitevalServer` for the `ui` that can be used in a more standard way/approach

- Updated dependencies [9db42c7]
  - @viteval/internal@0.3.2
  - @viteval/core@0.3.2
  - @viteval/ui@0.3.2

## 0.3.1

### Patch Changes

- 94c3934: Add a wrapper to prevent `resolveConfig` from throwing an error, and add logging for debugging.
- Updated dependencies [94c3934]
  - @viteval/internal@0.3.1
  - @viteval/core@0.3.1
  - @viteval/ui@0.3.1

## 0.3.0

### Minor Changes

- 8140eca: ## Eval Results UI (alpha)

  You can now view the results of your evals in a local UI that is built on top of the Viteval JSON File (`file`) reporter.

  To enable the UI, pass the `--ui` flag to the `viteval run` command.

  ```sh
  viteval run --ui
  ```

  The UI will be available at `http://localhost:3000`.

### Patch Changes

- Updated dependencies [8140eca]
  - @viteval/core@0.2.0
  - @viteval/ui@0.1.0

## 0.2.4

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

- Updated dependencies [b8a4e92]
  - @viteval/core@0.1.8
  - @viteval/ui@0.0.1

## 0.2.3

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

- Updated dependencies [ba9db56]
  - @viteval/core@0.1.7

## 0.2.2

### Patch Changes

- Updated dependencies [56cf589]
  - @viteval/core@0.1.6

## 0.2.1

### Patch Changes

- Updated dependencies [f42a1cc]
  - @viteval/core@0.1.5

## 0.2.0

### Minor Changes

- 4ddfa01: feat: Allow the `data` command to load the Viteval setup files and config

### Patch Changes

- Updated dependencies [4ddfa01]
  - @viteval/core@0.1.4

## 0.1.4

### Patch Changes

- ee6f429: feat: Add support for automatically parsing the `tsconfig.json` for the `viteval data` command

## 0.1.3

### Patch Changes

- Updated dependencies [7e7bd69]
- Updated dependencies [d99658c]
  - @viteval/core@0.1.3

## 0.1.2

### Patch Changes

- Updated dependencies [5d1186d]
- Updated dependencies [ae4035e]
  - @viteval/core@0.1.2

## 0.1.1

### Patch Changes

- Updated dependencies [98365f5]
  - @viteval/core@0.1.1

## 0.1.0

### Minor Changes

- 8c267d7: feat: Added `datasets` support for cacheing pre-generated datasets

### Patch Changes

- 1cc67b1: feat: Add `init` command
- 62941f3: chore: General cleanup and better testing
- Updated dependencies [8c267d7]
- Updated dependencies [62941f3]
- Updated dependencies [1cc67b1]
- Updated dependencies [62941f3]
  - @viteval/core@0.1.0
  - @viteval/internal@0.0.4

## 0.0.3

### Patch Changes

- Updated dependencies [ce74986]
  - @viteval/core@0.0.3
  - @viteval/internal@0.0.3

## 0.0.2

### Patch Changes

- Updated dependencies [f9d3314]
  - @viteval/core@0.0.2
  - @viteval/internal@0.0.2
