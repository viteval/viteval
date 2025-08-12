import { describe, expectTypeOf, it } from 'vitest';
import { foobar } from './foobar.js';

describe('foobar', () => {
  it('should return a string', () => {
    expectTypeOf(foobar()).toBeString();
  });
});
