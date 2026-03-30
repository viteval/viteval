import { createRouter as createTanstackRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

export const getRouter = () =>
  createTanstackRouter({
    defaultPreloadStaleTime: 0,
    routeTree,
    scrollRestoration: true,
  });

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
