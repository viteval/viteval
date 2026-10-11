import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/taggings/lookup')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const handlers = await import('@/server/api-taggings-lookup');
        return handlers.POST(request);
      },
    },
  },
});
