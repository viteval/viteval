import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createDirectory,
  createFile,
  directoryExists,
  fileExists,
} from './filesystem';

describe('filesystem utilities', () => {
  let root: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'viteval-filesystem-'));
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(root, { recursive: true, force: true });
  });

  it('should distinguish existing and missing paths', async () => {
    expect(await fileExists(root)).toMatchObject({ ok: true, value: true });
    expect(await directoryExists(root)).toMatchObject({
      ok: true,
      value: true,
    });
    expect(await fileExists(path.join(root, 'missing'))).toMatchObject({
      ok: true,
      value: false,
    });
    expect(await directoryExists(path.join(root, 'missing'))).toMatchObject({
      ok: true,
      value: false,
    });
  });

  it('should create parent directories only once', async () => {
    const destination = path.join(root, 'nested', 'file.txt');
    expect(await createDirectory(destination)).toMatchObject({
      ok: true,
      value: true,
    });
    expect(await createDirectory(destination)).toMatchObject({
      ok: true,
      value: false,
    });
  });

  it('should create a file without replacing existing content', async () => {
    const destination = path.join(root, 'nested', 'file.txt');
    expect(await createFile(destination, 'original')).toMatchObject({
      ok: true,
      value: true,
    });
    expect(await createFile(destination, 'replacement')).toMatchObject({
      ok: true,
      value: false,
    });
    expect(await fs.readFile(destination, 'utf8')).toBe('original');
  });

  it('should preserve access errors instead of treating them as missing paths', async () => {
    const failure = Object.assign(new Error('permission denied'), {
      code: 'EACCES',
    });
    vi.spyOn(fs, 'access').mockRejectedValue(failure);
    expect(await fileExists(root)).toMatchObject({ ok: false, error: failure });
    expect(await createFile(path.join(root, 'file'), 'content')).toMatchObject({
      ok: false,
      error: failure,
    });
  });

  it('should preserve access errors without an error code', async () => {
    const failure = new Error('access failed');
    vi.spyOn(fs, 'access').mockRejectedValue(failure);
    expect(await fileExists(root)).toMatchObject({ ok: false, error: failure });
  });

  it('should return directory creation failures without writing a file', async () => {
    const failure = Object.assign(new Error('read-only filesystem'), {
      code: 'EROFS',
    });
    vi.spyOn(fs, 'mkdir').mockRejectedValue(failure);
    expect(
      await createFile(path.join(root, 'nested', 'file'), 'content')
    ).toMatchObject({ ok: false, error: failure });
    expect(await fs.readdir(root)).toEqual([]);
  });

  it('should return write failures after creating the parent directory', async () => {
    const failure = Object.assign(new Error('disk full'), { code: 'ENOSPC' });
    vi.spyOn(fs, 'writeFile').mockRejectedValue(failure);
    expect(
      await createFile(path.join(root, 'nested', 'file'), 'content')
    ).toMatchObject({ ok: false, error: failure });
    expect(await fs.readdir(path.join(root, 'nested'))).toEqual([]);
  });
});
