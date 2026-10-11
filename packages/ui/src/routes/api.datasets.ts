import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/datasets')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const handlers = await import('@/server/api-datasets');
        return handlers.GET(request);
      },
    },
  },
});
