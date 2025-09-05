import type { Server } from 'node:http';
import path from 'node:path';
import express from 'express';
import { findUp } from 'find-up';
import getPort from 'get-port';
import { listener } from './.output/server/index.mjs';

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
  const app = express();
  app.use(express.static(path.join(import.meta.dirname, '.output', 'public')));
  app.use(listener);
  let server: Server;
  return {
    /**
     * Starts the Viteval server
     * @returns The port the server is listening on
     */
    async start(): Promise<number> {
      // set the root path in the environment variables
      const root = await findRoot(options?.root);
      process.env.VITEVAL_ROOT_PATH = root;
      process.env.VITEVAL_DEBUG_MODE = options?.debug ? 'true' : 'false';

      const port = await getPort({ port: options?.port ?? 3000 });
      return new Promise((resolve) => {
        server = app.listen(port, () => {
          resolve(port);
        });
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
        server.close(() => {
          // Reset the environment variables
          process.env.VITEVAL_ROOT_PATH = undefined;
          process.env.VITEVAL_DEBUG_MODE = undefined;
          resolve();
        });
      });
    },
  };
}

/*
|------------------
| Internals
|------------------
*/

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
