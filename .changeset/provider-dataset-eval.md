---
'@viteval/providers': minor
'@viteval/core': minor
'viteval': minor
---

Add provider abstraction for datasets and eval runs with built-in Braintrust support

- Add `Provider`, `DatasetProvider`, and `EvalProvider` interfaces to `@viteval/core`
- Add `@viteval/providers` package with scoped provider implementations
- Built-in `viteval()` provider using SQLite (default) or PostgreSQL via Prisma
- Built-in `braintrust()` provider using `@braintrust/api` (optional peer dep)
- Auto-inject default SQLite provider in `defineConfig()` when no provider is specified
- Support composable providers (mix different providers for datasets vs evals)
- Auto-persist eval results when a provider is configured
- Add `addResults` batch method on `EvalProvider` for providers supporting bulk insert
