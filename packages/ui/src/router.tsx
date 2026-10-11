import { createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

/**
 * Creates an isolated router for each Start request.
 * @returns The dashboard router.
 * @example const router = getRouter();
 */
export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    parseSearch,
    stringifySearch,
  });
}

function parseSearch(search: string): Record<string, string | string[]> {
  const params = new URLSearchParams(search);
  return Object.fromEntries(
    [...new Set(params.keys())].map((key) => {
      const values = params.getAll(key);
      return [key, values.length === 1 ? values[0] : values];
    })
  );
}

function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams(
    Object.entries(search).flatMap(([key, value]) => {
      const values: unknown[] = Array.isArray(value) ? value : [value];
      return values
        .filter((item) => item !== undefined)
        .map((item): [string, string] => [key, String(item)]);
    })
  );
  const query = params.toString();
  return query ? `?${query}` : '';
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
