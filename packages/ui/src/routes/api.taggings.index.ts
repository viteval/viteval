import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/taggings/')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const handlers = await import('@/server/api-taggings');
        return handlers.POST(request);
      },
      DELETE: async ({ request }) => {
        const handlers = await import('@/server/api-taggings');
        return handlers.DELETE(request);
      },
    },
  },
});
