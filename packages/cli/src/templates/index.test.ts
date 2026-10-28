import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createFileFromTemplate, readTemplateContents } from './index';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('templates', () => {
  it.each(['viteval.config.ts', 'starter.eval.ts'] as const)('should write %s unchanged and preserve existing files', async (template) => {
    const root = await mkdtemp(path.join(tmpdir(), 'viteval-template-')), destination = path.join(root, 'nested/template.ts');
    roots.push(root);
    const expected = await readTemplateContents(template);
    expect(expected.ok).toBe(true);
    expect(await createFileFromTemplate(destination, template)).toMatchObject({ ok: true, value: true });
    expect(await readFile(destination, 'utf8')).toBe(expected.ok ? expected.value : '');
    await writeFile(destination, 'user content');
    expect(await createFileFromTemplate(destination, template)).toMatchObject({ ok: true, value: false });
    expect(await readFile(destination, 'utf8')).toBe('user content');
  });

  it('should return filesystem errors without throwing', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'viteval-template-'));
    roots.push(root);
    await mkdir(path.join(root, 'nested'));
    await writeFile(path.join(root, 'nested/block'), 'not a directory');
    expect(await createFileFromTemplate(path.join(root, 'nested/block/config.ts'), 'viteval.config.ts')).toMatchObject({ ok: false });
  });
});
