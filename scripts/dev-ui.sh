#!/usr/bin/env bash
# Usage: pnpm dev:ui [path]

set -euo pipefail

case "${1:-}" in
  -h|--help|help)
    echo "Usage: pnpm dev:ui [path]"
    echo ""
    echo "Start the viteval UI dev server pointed at a project root."
    echo ""
    echo "Arguments:"
    echo "  path    Path to a project with a .viteval directory (default: cwd)"
    echo ""
    echo "Examples:"
    echo "  pnpm dev:ui examples/basic"
    echo "  pnpm dev:ui examples/vercel-ai"
    echo "  pnpm dev:ui examples/voltagent"
    echo "  pnpm dev:ui"
    exit 0
    ;;
esac

ROOT="${1:-.}"

if [ ! -d "$ROOT" ]; then
  echo "Error: '$ROOT' is not a directory" >&2
  exit 1
fi

ABSOLUTE_ROOT="$(cd "$ROOT" && pwd)"

echo "Starting viteval UI with root: $ABSOLUTE_ROOT"

VITEVAL_ROOT_PATH="$ABSOLUTE_ROOT" pnpm --filter @viteval/ui dev
