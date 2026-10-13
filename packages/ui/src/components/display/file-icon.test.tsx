import { describe, expect, it } from 'vitest';
import { detectFileType } from '@/components/display/file-icon';

describe('detectFileType', () => {
  it.each([
    ['C:\\project\\Dockerfile', 'docker'],
    ['C:\\project\\.env', 'env'],
    ['/project/Dockerfile', 'docker'],
    ['/project/.eslintrc', 'config'],
    ['.bashrc', 'config'],
    ['src.unknown', 'file'],
    ['marc.unknown', 'file'],
    ['src.ts', 'typescript'],
    ['vite.config.ts', 'typescript'],
  ])('should classify %s as %s', (path, expected) => {
    expect(detectFileType(path)).toBe(expected);
  });
});
