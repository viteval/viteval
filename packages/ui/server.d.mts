//#region server.d.ts
interface CreateVitevalServerOptions {
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
declare function createVitevalServer(options?: CreateVitevalServerOptions): {
  /**
   * Starts the Viteval server
   * @returns The port the server is listening on
   */
  start(): Promise<number>;
  /**
   * Restarts the Viteval server
   * @returns The port the server is listening on
   */
  restart(): Promise<number>;
  /**
   * Shuts down the Viteval server
   */
  shutdown(): Promise<void>;
};
//#endregion
export { CreateVitevalServerOptions, createVitevalServer };
//# sourceMappingURL=server.d.mts.map