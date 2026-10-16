import { describe, expect, it } from 'vitest';
import { detectValueKind } from '@/components/value/detect';

describe('detectValueKind', () => {
  it.each(['42', '3.14', 'true', 'false', 'null', '"answer"'])(
    'should retain JSON scalar string %s as text',
    (value) => {
      expect(detectValueKind(value)).toBe('text');
    }
  );
  it.each(['{"answer":42}', '[1,2,3]'])(
    'should recognize structured JSON %s as an object',
    (value) => {
      expect(detectValueKind(value)).toBe('object');
    }
  );
});
