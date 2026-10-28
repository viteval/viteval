import { describe, expect, it } from 'vitest';
import { resolve } from './utils';

describe('resolve', () => {
  it('handles non-promise values', async () => {
    await expect(resolve('test')).resolves.toBe('test');
  });

  it('handles promise values', async () => {
    await expect(resolve(Promise.resolve('test'))).resolves.toBe('test');
  });

  it('should propagate rejected promises', async () => {
    await expect(resolve(Promise.reject(new Error('failure')))).rejects.toThrow(
      'failure'
    );
  });
});
