import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/results/$id')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const handlers = await import('@/server/api-result');
        return handlers.GET(request, { params });
      },
    },
  },
});
