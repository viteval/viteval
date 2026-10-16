import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/results/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const handlers = await import('@/server/api-results');
        return handlers.GET(request);
      },
    },
  },
});
