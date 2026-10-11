import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/suites')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const handlers = await import('@/server/api-suites');
        return handlers.GET(request);
      },
    },
  },
});
