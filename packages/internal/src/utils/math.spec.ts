import { describe, expect, it } from 'vitest';
import { clamp } from './math';

describe('clamp', () => {
  it('should return value when within range', () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('should clamp to min when below range', () => {
    expect(clamp(-0.5, 0, 1)).toBe(0);
    expect(clamp(-100, 0, 10)).toBe(0);
  });

  it('should clamp to max when above range', () => {
    expect(clamp(1.5, 0, 1)).toBe(1);
    expect(clamp(100, 0, 10)).toBe(10);
  });

  it('should handle min equal to max', () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });

  it('should handle boundary values exactly', () => {
    expect(clamp(0, 0, 1)).toBe(0);
    expect(clamp(1, 0, 1)).toBe(1);
  });

  it('should handle negative ranges', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(0, -10, -1)).toBe(-1);
    expect(clamp(-20, -10, -1)).toBe(-10);
  });
});
