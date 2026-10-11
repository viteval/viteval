import type { ChildProcess } from 'node:child_process';
import { fork } from 'node:child_process';
import path from 'node:path';
import getPort from 'get-port';

const DEFAULT_PORT = 6274;

export interface CreateVitevalServerOptions {
  /**
   * Root path containing the `.viteval` directory.
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
  let exit: Promise<void> | undefined;
  let stopping = false;

  return {
    /**
     * Starts the Viteval server
     * @returns The port the server is listening on
     */
    async start(): Promise<number> {
      if (child) throw new Error('Viteval UI server is already running');
      stopping = false;
      const root = path.resolve(options?.root ?? process.cwd());
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
        const runningChild = child;
        exit = new Promise<void>((resolveExit, rejectExit) => {
          runningChild.once('error', rejectExit);
          runningChild.once('exit', (code, signal) => {
            if (stopping) resolveExit();
            else
              rejectExit(
                new Error(
                  `Viteval UI server exited unexpectedly (code=${code ?? 'null'}, signal=${signal ?? 'null'})`
                )
              );
          });
        });
        // Startup may fail before the caller can subscribe through waitForExit().
        void exit.catch(() => {});

        let settled = false;
        let stdout = '';
        const readinessTimer = setTimeout(() => {
          if (settled) {
            return;
          }
          finish(
            new Error('viteval UI server did not become ready within 10s')
          );
          child?.kill();
        }, 10_000);

        const finish = (value: number | Error) => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(readinessTimer);
          if (value instanceof Error) {
            reject(value);
          } else {
            resolve(value);
          }
        };

        child.on('error', finish);
        child.on('exit', (code, signal) => {
          child = undefined;
          if (settled) {
            return;
          }
          finish(
            new Error(
              `viteval UI server exited before ready (code=${code ?? 'null'}, signal=${signal ?? 'null'})`
            )
          );
        });

        child.stderr?.on('data', (data: Buffer) => {
          const msg = data.toString();
          if (options?.debug) {
            process.stderr.write(msg);
          }
        });

        child.stdout?.on('data', (data: Buffer) => {
          const msg = data.toString();
          stdout = `${stdout}${msg}`.slice(-1024);
          if (options?.debug) {
            process.stdout.write(msg);
          }
          if (stdout.includes('Ready') || stdout.includes('started server')) {
            finish(port);
          }
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
     * Wait for shutdown and surface unexpected child-process exits.
     * @returns Resolves for requested shutdown, rejects for server failure.
     * @example await server.waitForExit();
     */
    async waitForExit(): Promise<void> {
      if (!exit) throw new Error('Viteval UI server has not been started');
      await exit;
    },
    /**
     * Shuts down the Viteval server
     */
    async shutdown(): Promise<void> {
      stopping = true;
      return new Promise((resolve) => {
        if (
          !child ||
          child.pid === undefined ||
          child.exitCode !== null ||
          child.signalCode !== null
        ) {
          child = undefined;
          resolve();
          return;
        }

        child.once('exit', () => resolve());
        child.kill();
      });
    },
  };
}
