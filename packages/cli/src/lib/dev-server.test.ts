import { exec } from 'node:child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startDevServer } from './dev-server';

vi.mock('node:child_process', () => ({ exec: vi.fn() }));
afterEach(() => vi.clearAllMocks());

describe('startDevServer', () => {
  it('should wait for a successful server process', async () => {
    vi.mocked(exec).mockImplementation((command, callback) => {
      if (typeof callback === 'function') callback(null, 'ready', '');
      return {} as ReturnType<typeof exec>;
    });
    await expect(startDevServer()).resolves.toBeUndefined();
    expect(exec).toHaveBeenCalledOnce();
  });

  it('should propagate child process failures', async () => {
    const error = new Error('server failed');
    vi.mocked(exec).mockImplementation((command, callback) => {
      if (typeof callback === 'function') callback(error, '', '');
      return {} as ReturnType<typeof exec>;
    });
    await expect(startDevServer()).rejects.toBe(error);
  });

  it('should reject server diagnostics written to stderr', async () => {
    vi.mocked(exec).mockImplementation((command, callback) => {
      if (typeof callback === 'function') callback(null, '', 'startup warning');
      return {} as ReturnType<typeof exec>;
    });
    await expect(startDevServer()).rejects.toBe('startup warning');
  });
});
