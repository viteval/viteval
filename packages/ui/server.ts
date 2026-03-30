import type { ServerType } from '@hono/node-server';
import path from 'node:path';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { findUp } from 'find-up';
import getPort from 'get-port';

export interface CreateVitevalServerOptions {
  /**
   * A custom root path to serve the UI from, otherwise will look for the `viteval.config.ts` file or `.viteval` directory
   * @default process.cwd()
   */
  root?: string;
  /**
   * A custom port to listen on
   * @default 3000
   */
  port?: number;
  /**
   * Turn on debug mode (used for development)
   * @default false
   */
  debug?: boolean;
}

/**
 * Creates a Viteval server
 *
 * ```ts
 * const server = createVitevalServer({ port: 3000 });
 * await server.start();
 * ```
 *
 * @param options - The options for the Viteval server
 * @returns The Viteval server
 */
export function createVitevalServer(options?: CreateVitevalServerOptions) {
  let server: ServerType | undefined;

  return {
    /**
     * Starts the Viteval server
     * @returns The port the server is listening on
     */
    async start(): Promise<number> {
      const root = await findRoot(options?.root);
      process.env.VITEVAL_ROOT_PATH = root;
      process.env.VITEVAL_DEBUG_MODE = options?.debug ? 'true' : 'false';

      const port = await getPort({ port: options?.port ?? 3000 });
      const standaloneDir = path.join(
        import.meta.dirname,
        'dist',
        '.next',
        'standalone'
      );

      const app = new Hono();

      app.use(
        '/*',
        serveStatic({
          root: path.join(
            import.meta.dirname,
            'dist',
            '.next',
            'standalone',
            'public'
          ),
        })
      );

      app.use(
        '/_next/static/*',
        serveStatic({
          rewriteRequestPath: (p: string) => p.replace('/_next/static', ''),
          root: path.join(import.meta.dirname, 'dist', '.next', 'static'),
        })
      );

      // Import and use the Next.js standalone server handler
      const nextHandler = await import(path.join(standaloneDir, 'server.js'));
      app.all('*', async (c) => {
        const url = new URL(c.req.url);
        url.port = String(port);
        const request = new Request(url.toString(), {
          method: c.req.method,
          headers: c.req.raw.headers,
          body:
            c.req.method !== 'GET' && c.req.method !== 'HEAD'
              ? c.req.raw.body
              : undefined,
          // @ts-expect-error - Node.js specific option for request body handling
          duplex: 'half',
        });
        const response = await nextHandler.default(request);
        return response;
      });

      return new Promise((resolve) => {
        server = serve(
          {
            fetch: app.fetch,
            port,
          },
          () => {
            resolve(port);
          }
        );
      });
    },
    /**
     * Restarts the Viteval server
     * @returns The port the server is listening on
     */
    async restart(): Promise<number> {
      await this.shutdown();
      return await this.start();
    },
    /**
     * Shuts down the Viteval server
     */
    async shutdown(): Promise<void> {
      return new Promise((resolve) => {
        if (server) {
          server.close(() => {
            process.env.VITEVAL_ROOT_PATH = undefined;
            process.env.VITEVAL_DEBUG_MODE = undefined;
            resolve();
          });
        } else {
          resolve();
        }
      });
    },
  };
}

async function findRoot(root: string = process.cwd()) {
  const configFile = await findUp(
    [
      ...['ts', 'js', 'mts', 'mjs'].map((ext) => `viteval.config.${ext}`),
      '.viteval',
    ],
    {
      cwd: root,
    }
  );
  return configFile ? path.dirname(configFile) : root;
}
