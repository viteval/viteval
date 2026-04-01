import type { ChildProcess } from 'node:child_process';
import { fork } from 'node:child_process';
import path from 'node:path';
import { findUp } from 'find-up';
import getPort from 'get-port';

const DEFAULT_PORT = 6274;

export interface CreateVitevalServerOptions {
  /**
   * A custom root path to serve the UI from, otherwise will look for the `viteval.config.ts` file or `.viteval` directory
   * @default process.cwd()
   */
  root?: string;
  /**
   * A custom port to listen on
   * @default 6274
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
 * const server = createVitevalServer({ port: 6274 });
 * await server.start();
 * ```
 *
 * @param options - The options for the Viteval server
 * @returns The Viteval server
 */
export function createVitevalServer(options?: CreateVitevalServerOptions) {
  let child: ChildProcess | undefined;

  return {
    /**
     * Starts the Viteval server
     * @returns The port the server is listening on
     */
    async start(): Promise<number> {
      const root = await findRoot(options?.root);
      const port = await getPort({
        port: [
          options?.port ?? DEFAULT_PORT,
          DEFAULT_PORT,
          DEFAULT_PORT + 1,
          DEFAULT_PORT + 2,
        ],
      });

      const serverScript = path.join(
        import.meta.dirname,
        'dist',
        '.next',
        'standalone',
        'packages',
        'ui',
        'server.js'
      );

      return new Promise((resolve, reject) => {
        child = fork(serverScript, {
          env: {
            ...process.env,
            HOSTNAME: 'localhost',
            PORT: String(port),
            VITEVAL_DEBUG_MODE: options?.debug ? 'true' : 'false',
            VITEVAL_ROOT_PATH: root,
          },
          stdio: 'pipe',
        });

        child.on('error', reject);

        child.stderr?.on('data', (data: Buffer) => {
          const msg = data.toString();
          if (options?.debug) {
            process.stderr.write(msg);
          }
        });

        child.stdout?.on('data', (data: Buffer) => {
          const msg = data.toString();
          if (options?.debug) {
            process.stdout.write(msg);
          }
          if (msg.includes('Ready') || msg.includes('started server')) {
            resolve(port);
          }
        });

        // Fallback: resolve after a short delay if no "Ready" message
        setTimeout(() => resolve(port), 2000);
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
        if (child) {
          child.on('exit', () => {
            child = undefined;
            resolve();
          });
          child.kill();
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
