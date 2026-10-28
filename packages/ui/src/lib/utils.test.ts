import { describe, expect, it } from 'vitest';
import {
  cn,
  formatChartTimestamp,
  formatDuration,
  formatFileSize,
  formatPassRate,
  formatTimestamp,
  isJSON,
  slugify,
} from './utils';

describe('display utilities', () => {
  it('should merge conditional utility classes with the last conflicting value', () => {
    expect(cn('p-2', false, { 'text-sm': true }, 'p-4')).toBe('text-sm p-4');
  });
  it.each([
    [0, '0 B'],
    [1024, '1 KB'],
    [1536, '1.5 KB'],
    [1024 ** 2, '1 MB'],
    [Number.NaN, 'n/a'],
  ])('should format %s bytes as %s', (value, expected) => {
    expect(formatFileSize(Number(value))).toBe(expected);
  });
  it.each([
    [0, '0.000ms'],
    [999, '999.000ms'],
    [1000, '1.00s'],
    [1250, '1.25s'],
    [Number.NaN, 'n/a'],
  ])('should format %s milliseconds as %s', (value, expected) => {
    expect(formatDuration(Number(value))).toBe(expected);
  });
  it('should preserve invalid timestamps and format numeric strings identically', () => {
    expect(formatTimestamp('invalid')).toBe('invalid');
    expect(formatTimestamp('1000')).toBe(formatTimestamp(1000));
    expect(formatChartTimestamp('invalid')).toBe('invalid');
    expect(formatChartTimestamp('1000')).toBe(formatChartTimestamp(1000));
    expect(formatTimestamp(1000)).toBe(new Date(1000).toLocaleString());
  });
  it('should distinguish an empty population from a zero pass rate', () => {
    expect(formatPassRate(0, 0)).toBe('N/A');
    expect(formatPassRate(0, 2)).toBe('0.0%');
    expect(formatPassRate(1, 3)).toBe('33.3%');
    expect(slugify(' --My Suite [Model]-- ')).toBe('my-suite-model');
  });
  it.each([{}, [], '{}', '[]', ' null ', 'true', 'false', '1', '1.2'])(
    'should recognize JSON %j',
    (value) => expect(isJSON(value)).toBe(true)
  );
  it.each([
    null,
    undefined,
    1,
    false,
    '',
    ' ',
    'hello',
    '{broken}',
    '[broken]',
    'NaN',
    '01',
  ])('should reject non-JSON %j', (value) => expect(isJSON(value)).toBe(false));
});
