# @viteval/ui

## 0.5.7

### Patch Changes

- 778e2ba: deps: update core packages to latest version

## 0.5.6

## 0.5.5

## 0.5.4

## 0.5.3

### Patch Changes

- d3a8019: Change the name to not just be "Markdown Viewer" but "Field Viewer"

## 0.5.2

### Patch Changes

- 99b8d5c: add ability to view the scores

## 0.5.1

## 0.5.0

### Minor Changes

- 4b2822a: add new UI for viewing the contents of a JSON object as markdown

## 0.4.3

### Patch Changes

- 5ad0932: fixed issue with types for datasets

## 0.4.2

## 0.4.1

### Patch Changes

- 71ee1af: fix issue with datasets on error

## 0.4.0

### Minor Changes

- 864c595: ## Viteval UI (beta)

  This release includes major improvements to the Viteval UI, including:
  - Adding a new `datasets` page to view and manage your evaluation datasets
  - Adding UI states to show when an evaluation is running and updating it as it runs/finishes
  - Cleaning up the UI for Results List and Result Detail pages
  - Adding better viewing experience for Result Detail page

## 0.3.2

## 0.3.1

## 0.1.0

### Minor Changes

- 8140eca: ## Eval Results UI (alpha)

  You can now view the results of your evals in a local UI that is built on top of the Viteval JSON File (`file`) reporter.

  To enable the UI, pass the `--ui` flag to the `viteval run` command.

  ```sh
  viteval run --ui
  ```

  The UI will be available at `http://localhost:3000`.

## 0.0.1

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
