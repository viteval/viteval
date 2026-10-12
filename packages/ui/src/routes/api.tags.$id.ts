import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/tags/$id')({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const handlers = await import('@/server/api-tag');
        return handlers.PATCH(request, { params });
      },
      DELETE: async ({ request, params }) => {
        const handlers = await import('@/server/api-tag');
        return handlers.DELETE(request, { params });
      },
    },
  },
});
