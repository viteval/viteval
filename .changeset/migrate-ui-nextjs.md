---
'@viteval/ui': major
---

Migrate the v1 dashboard from Next.js to TanStack Start and TanStack Router.

### Architecture

- Replace Next.js App Router and standalone output with typed TanStack file routes and Vite client/server builds.
- Serve bundled browser assets and Start SSR/API requests through a Node child process with a Hono bridge.
- Preserve the public `createVitevalServer()` launcher API, project-root selection, automatic port selection, and default port 6274.
- Keep existing dashboard and API URLs, persisted data formats, filtering, tagging, and inspection workflows.
- Verify packed JavaScript/CSS delivery, SSR deep links, missing-page/resource behavior, and clean server shutdown.

The existing theme, summary cards, charts, sortable tables, case diagnostics,
suite history/source views, and dataset metadata remain available. URL-based
filters and encoded detail identifiers continue to work through direct links
and browser reloads.
