/**
 * Clamp a value between a minimum and maximum.
 *
 * @param value - The value to clamp
 * @param min - The minimum bound
 * @param max - The maximum bound
 * @returns The clamped value
 *
 * @example
 * ```ts
 * clamp(1.5, 0, 1);   // 1
 * clamp(-0.5, 0, 1);  // 0
 * clamp(0.7, 0, 1);   // 0.7
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
