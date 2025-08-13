import { describe, expect, it } from 'vitest';
import { resolve } from './utils';

describe('resolve', () => {
  it('handles non-promise values', () => {
    expect(resolve('test')).toBe('test');
  });

  it('handles promise values', async () => {
    expect(new Promise((resolve) => resolve('test'))).toBe('test');
  });
});
