# @viteval/providers

## 1.0.0-rc.1

### Minor Changes

- 878f3d5: Add provider abstraction for datasets and eval runs with built-in Braintrust support

  - Add `Provider`, `DatasetProvider`, and `EvalProvider` interfaces to `@viteval/core`
  - Add `@viteval/providers` package with scoped provider implementations
  - Built-in `viteval()` provider using SQLite (default) or PostgreSQL via Prisma
  - Built-in `braintrust()` provider using `@braintrust/api` (optional peer dep)
  - Auto-inject default SQLite provider in `defineConfig()` when no provider is specified
  - Support composable providers (mix different providers for datasets vs evals)
  - Auto-persist eval results when a provider is configured
  - Add `addResults` batch method on `EvalProvider` for providers supporting bulk insert

### Patch Changes

- Updated dependencies [7cda487]
- Updated dependencies [7f3ba21]
- Updated dependencies [81e6d77]
- Updated dependencies [878f3d5]
- Updated dependencies [f862d31]
- Updated dependencies [de505ac]
- Updated dependencies [92023da]
  - @viteval/core@1.0.0-rc.1
  - @viteval/internal@1.0.0-rc.1
