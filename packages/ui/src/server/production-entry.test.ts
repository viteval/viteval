import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const boundary = vi.hoisted(() => ({
  fetch: vi.fn(
    async (request: Request) =>
      new Response(`Start: ${new URL(request.url).pathname}`)
  ),
  serve: vi.fn(),
  close: vi.fn((callback: () => void) => callback()),
  closeIdleConnections: vi.fn(),
}));
vi.mock('@hono/node-server', () => ({ serve: boundary.serve }));
// Exercise the bridge, not generated assets or the generated Start bundle.
vi.mock('@hono/node-server/serve-static', () => ({
  serveStatic: () => async (_context: unknown, next: () => Promise<void>) =>
    next(),
}));

const entryUrl = new URL('../../dist/server/server.js', import.meta.url).href;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  boundary.serve.mockImplementation(
    (_options: unknown, ready: (address: { port: number }) => void) => {
      ready({ port: 4321 });
      return {
        close: boundary.close,
        closeIdleConnections: boundary.closeIdleConnections,
      };
    }
  );
  vi.doMock(entryUrl, () => ({ default: { fetch: boundary.fetch } }));
  vi.spyOn(process, 'once').mockReturnValue(process);
  vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  vi.stubEnv('HOSTNAME', '127.0.0.1');
  vi.stubEnv('PORT', '4321');
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();
  vi.doUnmock(entryUrl);
});

describe('production HTTP bridge entry', () => {
  it('should use default host and port when the environment does not configure them', async () => {
    vi.stubEnv('HOSTNAME', undefined);
    vi.stubEnv('PORT', undefined);
    await import('../../production-server.js');
    expect(boundary.serve).toHaveBeenCalledWith(
      expect.objectContaining({ hostname: 'localhost', port: 6274 }),
      expect.any(Function)
    );
  });
  it('should announce readiness, bind configured host and forward dynamic requests to Start', async () => {
    await import('../../production-server.js');
    expect(boundary.serve).toHaveBeenCalledWith(
      expect.objectContaining({ hostname: '127.0.0.1', port: 4321 }),
      expect.any(Function)
    );
    const options: { fetch: (request: Request) => Promise<Response> } =
      boundary.serve.mock.calls[0][0];
    const response = await options.fetch(
      new Request('http://localhost/api/results')
    );
    expect(await response.text()).toBe('Start: /api/results');
    expect(process.stdout.write).toHaveBeenCalledWith(
      'Viteval UI Ready on http://localhost:4321\n'
    );
    expect(process.once).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(process.once).toHaveBeenCalledWith('SIGINT', expect.any(Function));
  });
  it('should close active and idle connections on shutdown and clear its exit watchdog', async () => {
    vi.useFakeTimers();
    const exit = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    await import('../../production-server.js');
    const signal = vi
      .mocked(process.once)
      .mock.calls.find(([event]) => event === 'SIGTERM')?.[1];
    if (!signal) throw new Error('Missing shutdown handler');
    signal();
    expect(boundary.close).toHaveBeenCalledOnce();
    expect(boundary.closeIdleConnections).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledWith(0);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('should force exit after five seconds if close never completes', async () => {
    vi.useFakeTimers();
    boundary.serve.mockReturnValue({ close: vi.fn() });
    const exit = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    await import('../../production-server.js');
    const signal = vi
      .mocked(process.once)
      .mock.calls.find(([event]) => event === 'SIGINT')?.[1];
    if (!signal) throw new Error('Missing shutdown handler');
    signal();
    await vi.advanceTimersByTimeAsync(5000);
    expect(exit).toHaveBeenCalledWith(0);
  });
  it.each([null, {}, { fetch: false }, { fetch: 'not a function' }])(
    'should reject an invalid generated Start entry %j',
    async (value) => {
      vi.doMock(entryUrl, () => ({ default: value }));
      await expect(import('../../production-server.js')).rejects.toThrow(
        'does not export a Start fetch handler'
      );
      expect(boundary.serve).not.toHaveBeenCalled();
    }
  );
});
