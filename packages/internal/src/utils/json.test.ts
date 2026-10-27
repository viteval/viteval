import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { serializeJson, writeJsonAtomic } from './json';

describe('serializeJson', () => {
  it('should format plain and null-prototype objects, arrays, dates and primitives', () => {
    const value = {
      nested: Object.assign(Object.create(null), { valid: true }),
      array: [null, 0, 'text'],
      date: new Date('2026-01-01T00:00:00Z'),
    };
    expect(serializeJson(value)).toBe(`${JSON.stringify(value, null, 2)}\n`);
    expect(serializeJson(null)).toBe('null\n');
  });
  it.each([NaN, Infinity, -Infinity])(
    'should reject non-finite number %s',
    (value) => {
      expect(() => serializeJson({ value })).toThrow('finite numbers');
    }
  );
  it.each([1n, () => 1, Symbol('value')])(
    'should reject unsupported value %s',
    (value) => {
      expect(() => serializeJson({ value })).toThrow('Unsupported JSON value');
    }
  );
  it.each([new Map(), new Set(), /pattern/])(
    'should reject non-plain object %s',
    (value) => {
      expect(() => serializeJson(value)).toThrow(
        'plain objects, arrays, or dates'
      );
    }
  );
  it('should reject undefined at the top level', () => {
    expect(() => serializeJson(undefined)).toThrow('top-level value');
  });
  it('should reject cycles', () => {
    const value: Record<string, unknown> = {};
    value.self = value;
    expect(() => serializeJson(value)).toThrow(/circular/i);
  });
});

describe('writeJsonAtomic', () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'viteval-json-'));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });
  it('should create missing parents and replace JSON without leaving temporary files', async () => {
    const filePath = path.join(root, 'nested', 'result.json');
    await writeJsonAtomic({ filePath, value: { score: 0 } });
    await writeJsonAtomic({ filePath, value: { score: 1 } });
    expect(await readFile(filePath, 'utf8')).toBe(serializeJson({ score: 1 }));
    expect(await readdir(path.dirname(filePath))).toEqual(['result.json']);
  });
  it('should preserve existing content when serialization fails', async () => {
    const filePath = path.join(root, 'result.json');
    await writeFile(filePath, 'original');
    await expect(
      writeJsonAtomic({ filePath, value: Infinity })
    ).rejects.toThrow('finite numbers');
    expect(await readFile(filePath, 'utf8')).toBe('original');
    expect(await readdir(root)).toEqual(['result.json']);
  });
  it('should clean up temporary files when replacement fails', async () => {
    const filePath = path.join(root, 'destination');
    await mkdir(filePath);
    await expect(writeJsonAtomic({ filePath, value: {} })).rejects.toThrow();
    expect(await readdir(root)).toEqual(['destination']);
    expect(await readdir(filePath)).toEqual([]);
  });
});
