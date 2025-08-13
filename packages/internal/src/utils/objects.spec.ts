import { describe, expect, it } from 'vitest';
import type { DangerouslyAllowAny } from '#/types';
import { hasKey } from './objects';

describe('hasKey', () => {
  it('should return true if the object has the key', () => {
    const obj = { a: 1 };
    expect(hasKey(obj, 'a')).toBe(true);
  });

  it('should return false if the object does not have the key', () => {
    const obj = { a: 1 };
    expect(hasKey(obj, 'b')).toBe(false);
  });

  it('should return false if the object is null', () => {
    const obj = null;
    expect(hasKey(obj as DangerouslyAllowAny, 'a')).toBe(false);
  });

  it('should return false if the object is undefined', () => {
    const obj = undefined;
    expect(hasKey(obj as DangerouslyAllowAny, 'a')).toBe(false);
  });
});
