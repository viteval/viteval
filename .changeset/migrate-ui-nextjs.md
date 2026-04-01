---
'@viteval/ui': major
---

Migrate @viteval/ui from TanStack Start + Express to Next.js 16 standalone + retro gaming theme

### Architecture
- Replace TanStack Start/Router with Next.js 16 App Router (standalone output)
- Replace Express/Hono wrapper with child_process fork of Next.js standalone server
- Default port changed from 3000 to 6274 (avoids conflicts)
- `get-port` with fallback ports for automatic port selection

### Theme & Design
- Retro gaming aesthetic: Geist Mono for body text, Geist Pixel Square for headings
- Near-square border radius (0.2rem), darkened color palette
- Deep neon purple brand color (oklch 0.35 0.3 290)

### Dashboard
- Summary stat cards (results, datasets, pass rate, duration)
- Stacked bar chart for eval runs (passed vs failed) via shadcn charts + Recharts
- Latest 5 results with running/passed/failed status
- Latest 5 datasets with item counts

### Suites
- New `/suites` page — unique eval suites deduplicated across runs
- Suite detail page (`/suites/[name]`) with source code viewer and run history
- Sortable data table with name, file, status, runs, duration, mean score, pass rate

### Data Tables
- TanStack Table integration with shadcn Table for column-level sorting
- Shared `DataTable`, `DataTableColumnHeader`, `DataTablePagination` components
- Results table: suites, timestamp, status, duration, passed, failed, total columns
- Datasets table: name, description, path, items, storage columns

### Filtering
- Shared `ListFilter` component with configurable search (text or date-range)
- Date-time picker (Calendar + Popover + time input) for results filtering
- Status filter (passed/failed/running) and sort dropdowns
- Reset button to clear all filters
- URL search params for bookmarkable filter state

### API
- `GET /api/results` — list all results
- `GET /api/results/[id]` — get single result
- `GET /api/suites` — list unique suites
- `GET /api/datasets` — list all datasets

### Sidebar
- Non-clickable logo/branding header
- Dashboard home link with separator
- Navigation: Suites, Results, Datasets
- Full-width separators, overflow-x hidden fix
- Ghost button hover uses muted background instead of brand purple
