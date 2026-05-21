---
'@viteval/core': major
'@viteval/providers': major
'@viteval/ui': minor
---

Add polymorphic tag/tagging system for human labeling

### Core (`@viteval/core`)

- New `TagProvider` sub-interface with `list/create/update/delete` and `addTagging/removeTagging/listTaggings/listEntitiesForTag` ops
- New types: `StoredTag`, `StoredTagging`, `TagEntityType` (`'eval_run' | 'eval_result' | 'dataset' | 'dataset_item'`)
- `Provider.tags?: TagProvider` and `ProviderConfig` `{ tags? }` slot
- `getTagProvider()` / `requireTagProvider()` runtime accessors and `__viteval_tagProvider` global

### Providers (`@viteval/providers`)

- `viteval` provider exposes a Prisma-backed `TagProvider` (SQLite default, Postgres optional)
- New `Tag` + `Tagging` Prisma models with polymorphic `(entityType, entityId)` reference and unique `(tagId, entityType, entityId)` constraint
- Raw-SQL `ensureSchema()` updated with matching `tags` + `taggings` table creates and indexes

### UI (`@viteval/ui`)

- Tags stored in `.viteval/tags.json` + `.viteval/taggings.json` (FS-only for v1; provider DB sync deferred)
- New SDK resource `viteval.tags` mirroring the core `TagProvider` shape
- API routes: `GET/POST /api/tags`, `PATCH/DELETE /api/tags/[id]`, `POST/DELETE /api/taggings`, `POST /api/taggings/lookup`
- New components in `@/components/tag`: `TagChip`, `TagPicker`, `TagList`, `useTags` hook
- Tag editor on results detail and dataset detail pages
- "Tags" column added to results and datasets tables (display chips, batch-loaded once per render)

### Breaking changes

- `EvalRun.tags` column dropped from Prisma schema. Existing runs lose their string-array tags; re-tag via the new system after upgrading
- `StoredEvalRun.tags`, `CreateEvalRunParams.tags`, `ListEvalRunsParams.tags` removed — apply tags via `TagProvider.addTagging({ entityType: 'eval_run', entityId })` instead
- `CreateRunParams.tags` removed from `createRun()` — tag runs separately via the tag provider after creation
- `Braintrust` provider no longer writes/reads `_viteval_tags` metadata or filters by tags
