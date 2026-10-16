import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/tags/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const handlers = await import('@/server/api-tags');
        return handlers.GET(request);
      },
      POST: async ({ request }) => {
        const handlers = await import('@/server/api-tags');
        return handlers.POST(request);
      },
    },
  },
});
