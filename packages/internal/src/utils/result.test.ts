import { describe, expect, it } from 'vitest';
import { withResult } from './result';

describe('withResult', () => {
  it('should return a Result', async () => {
    const result = await withResult(() => 'hello');
    expect(result).toEqual({ status: 'ok', ok: true, result: 'hello' });
  });

  it('should return an error Result', async () => {
    const result = await withResult(() => {
      throw new Error('hello');
    });
    expect(result).toEqual({
      status: 'error',
      ok: false,
      result: new Error('hello'),
    });
  });
});
