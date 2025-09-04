import { createRouter as createTanstackRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

export const createRouter = () => {
  return createTanstackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
