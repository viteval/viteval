import { describe, expect, it } from 'vitest';
import { withResult } from './result';

describe('withResult', () => {
  it('should return a Result', async () => {
    const result = await withResult(() => 'hello');
    expect(result).toEqual({ ok: true, result: 'hello', status: 'ok' });
  });

  it('should return an error Result', async () => {
    const result = await withResult(() => {
      throw new Error('hello');
    });
    expect(result).toEqual({
      ok: false,
      result: new Error('hello'),
      status: 'error',
    });
  });
});
