import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { hasPackageJson } from './utils';
import { createLogger } from './logger';

describe('hasPackageJson', () => {
  it('should inspect real projects and default to the current working directory', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'viteval-package-'));
    try {
      expect(await hasPackageJson(root)).toMatchObject({
        ok: true,
        value: false,
      });
      await writeFile(path.join(root, 'package.json'), '{}');
      expect(await hasPackageJson(root)).toMatchObject({
        ok: true,
        value: true,
      });
      expect(await hasPackageJson()).toMatchObject({ ok: true, value: true });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe('createLogger', () => {
  it('should create independent configured loggers', () => {
    const first = createLogger(),
      second = createLogger();
    expect(first).not.toBe(second);
    expect(first.info).toBeTypeOf('function');
    expect(first.error).toBeTypeOf('function');
  });
});
