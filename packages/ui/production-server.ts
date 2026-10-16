import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';

interface StartServerEntry {
  fetch: (request: Request) => Response | Promise<Response>;
}

process.env.NODE_ENV ??= 'production';

const serverUrl = pathToFileURL(
  path.join(import.meta.dirname, 'dist/server/server.js')
);
const serverModule: unknown = await import(serverUrl.href);
if (
  typeof serverModule !== 'object' ||
  serverModule === null ||
  !('default' in serverModule) ||
  !isStartServerEntry(serverModule.default)
) {
  throw new Error('Viteval UI build does not export a Start fetch handler');
}
const start = serverModule.default;
const app = new Hono();
app.use(
  '*',
  serveStatic({ root: path.join(import.meta.dirname, 'dist/client') })
);
app.all('*', (context) => start.fetch(context.req.raw));

const server = serve(
  {
    fetch: app.fetch,
    hostname: process.env.HOSTNAME ?? 'localhost',
    port: Number(process.env.PORT ?? 6274),
  },
  ({ port }) => {
    process.stdout.write(`Viteval UI Ready on http://localhost:${port}\n`);
    process.send?.({ type: 'ready', port });
  }
);

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);

function shutdown() {
  const timeout = setTimeout(() => process.exit(0), 5_000);
  timeout.unref();
  server.close(() => {
    clearTimeout(timeout);
    process.exit(0);
  });
  if ('closeIdleConnections' in server) {
    server.closeIdleConnections();
  }
}

function isStartServerEntry(value: unknown): value is StartServerEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'fetch' in value &&
    typeof value.fetch === 'function'
  );
}
