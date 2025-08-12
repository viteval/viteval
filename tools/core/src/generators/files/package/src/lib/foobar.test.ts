import { describe, expect, it } from 'vitest';
import { foobar } from './foobar.js';

describe('foobar', () => {
  it('should return foobar', () => {
    expect(foobar()).toBe('foobar');
  });
});
