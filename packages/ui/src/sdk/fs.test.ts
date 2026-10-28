import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createFs } from './fs';
import { createViteval } from './client';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'viteval-fs-test-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('filesystem storage boundary', () => {
  it('should reject traversal without reading or writing outside storage', async () => {
    const fs = createFs(root);
    await writeFile(path.join(root, 'secret.json'), '{"secret":true}');
    for (const target of ['../secret.json', path.join(root, 'secret.json')]) {
      expect(await fs.readJson(target)).toBeNull();
      expect(await fs.readRawFile(target)).toBeNull();
      expect(await fs.readJsonFile(target)).toHaveProperty('error');
      expect((await fs.writeJson(target, {})).ok).toBe(false);
      expect(await fs.listJsonIds(target)).toEqual([]);
    }
    expect(fs.vitevalDir()).toBe(path.join(root, '.viteval'));
    expect(fs.relativePath(fs.filePath('datasets', 'test'))).toBe(
      '.viteval/datasets/test.json'
    );
  });
  it('should distinguish malformed JSON, missing files, directories and valid values', async () => {
    const fs = createFs(root);
    expect(await fs.listJsonIds('datasets')).toEqual([]);
    expect(await fs.readRawFile('missing')).toBeNull();
    expect(await fs.readJsonFile('missing')).toEqual({ data: null });
    expect((await fs.writeJson('datasets/good.json', { input: 1 })).ok).toBe(
      true
    );
    await writeFile(
      path.join(root, '.viteval/datasets/broken.json'),
      '{broken'
    );
    await writeFile(
      path.join(root, '.viteval/datasets/readme.txt'),
      'not JSON'
    );
    expect((await fs.listJsonIds('datasets')).sort()).toEqual([
      'broken',
      'good',
    ]);
    expect(await fs.readJson('datasets/good.json')).toEqual({ input: 1 });
    expect(await fs.readJson('datasets/broken.json')).toBeNull();
    expect(await fs.readJsonFile('datasets/broken.json')).toHaveProperty(
      'error'
    );
    expect(await fs.readJsonFile('datasets')).toHaveProperty('error');
    expect((await fs.writeJson('datasets/good.json/nested.json', {})).ok).toBe(
      false
    );
  });
});

describe('schema source discovery', () => {
  it('should return an empty discovery page when the source tree is unreadable', async () => {
    const source = path.join(root, 'src');
    await mkdir(source);
    await writeFile(path.join(source, 'private.eval.ts'), 'private source');
    await chmod(source, 0);
    try {
      expect(await createViteval({ root }).schemas.list()).toMatchObject({
        data: [],
        total: 0,
      });
    } finally {
      await chmod(source, 0o700);
    }
  });
  it('should discover only evaluation source files and read their original contents', async () => {
    await mkdir(path.join(root, 'src/nested'), { recursive: true });
    await writeFile(
      path.join(root, 'src/z.eval.ts'),
      'export const answer = 42;'
    );
    await writeFile(
      path.join(root, 'src/nested/a.eval.js'),
      'export default 1;'
    );
    await writeFile(path.join(root, 'src/ignored.ts'), 'ignore me');
    const sdk = createViteval({ root });
    expect(await sdk.schemas.list()).toMatchObject({
      total: 2,
      data: [{ name: 'a.eval.js' }, { name: 'z.eval.ts' }],
    });
    expect(await sdk.schemas.get({ id: 'src/z.eval.ts' })).toEqual({
      data: {
        id: 'src/z.eval.ts',
        name: 'z.eval.ts',
        path: 'src/z.eval.ts',
        content: 'export const answer = 42;',
      },
    });
    expect(await sdk.schemas.get({ id: '../outside.eval.ts' })).toEqual({
      data: null,
    });
    expect(await sdk.schemas.get({ id: 'missing.eval.ts' })).toEqual({
      data: null,
    });
  });
  it('should return an empty page for a project without evaluation files', async () => {
    expect(await createViteval({ root }).schemas.list()).toMatchObject({
      data: [],
      total: 0,
      hasMore: false,
    });
  });
});
