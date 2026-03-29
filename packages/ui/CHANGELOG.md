# @viteval/ui

## 1.0.0-rc.0

### Major Changes

- Migrate @viteval/ui from TanStack Start + Express to Next.js 16 + Hono + shadcn dashboard
  - Replace TanStack Start/Router with Next.js 16 App Router (standalone output)
  - Replace Express with Hono + @hono/node-server as production server wrapper
  - Replace header navigation with shadcn sidebar layout
  - Add dashboard home page with summary cards
  - Install all shadcn UI primitives via CLI
  - Replace @iconify/react with lucide-react
  - Add /api/results/[id] route for polling refresh
