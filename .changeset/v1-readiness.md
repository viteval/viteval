---
'viteval': major
'@viteval/core': major
'@viteval/providers': major
'@viteval/ui': minor
'@viteval/cli': minor
'@viteval/internal': minor
---

Complete the local-first v1 workflow with JSON provider storage, atomic writes,
native-worker dataset generation, execution diagnostics, optional SQLite and
Braintrust persistence, dashboard validation, and isolated packed-package checks.

JSON is now the default native provider. SQLite requires an explicit database
option. Tasks receive input and extra fields; expected answers are reserved for
scorers. All packages require Node 26 or newer.

Preserve renamed JSON datasets when names are reused, serialize concurrent
namespace changes, and retain authoritative outcomes in dashboard projections.
Dashboard reads preserve dataset identifiers and extra fields, expose skipped
counts, and report tag-storage failures. Add repeatable browser verification and
merged native-worker coverage reporting.

Discover default, named, and inline datasets in dataset and evaluation modules
without executing evaluation tasks or scorers. Deduplicate aliases and shared
re-exports, reject duplicate names, and report module import failures before
publishing their datasets.
