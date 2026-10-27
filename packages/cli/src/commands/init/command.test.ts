import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockLog,
  mockPrompts,
  runHandler as runNativeHandler,
} from 'maltty/test';
import { initCommand } from './command';

const directories: string[] = [],
  originalCwd = process.cwd();
const originalTty = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'viteval-init-unit-'));
  directories.push(root);
  process.chdir(root);
  Object.defineProperty(process.stdin, 'isTTY', {
    configurable: true,
    get: () => false,
  });
});

async function runHandler(options: Parameters<typeof runNativeHandler>[0]) {
  return await runNativeHandler({
    ...options,
    overrides: {
      ...options.overrides,
      log: options.overrides?.log ?? mockLog(),
    },
  });
}
afterEach(async () => {
  vi.restoreAllMocks();
  process.chdir(originalCwd);
  if (originalTty) Object.defineProperty(process.stdin, 'isTTY', originalTty);
  else Reflect.deleteProperty(process.stdin, 'isTTY');
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('initCommand', () => {
  it.each(['module', 'commonjs'])(
    'should initialize a real %s project without interactive prompts',
    async (type) => {
      await writeFile('package.json', JSON.stringify({ type }));
      vi.spyOn(process.stdin, 'isTTY', 'get').mockReturnValue(false);
      const result = await runHandler({ cmd: initCommand });
      expect(result.error).toBeUndefined();
      expect(
        await readFile(
          type === 'module' ? 'viteval.config.ts' : 'viteval.config.mts',
          'utf8'
        )
      ).toContain('createJsonProvider');
      expect(await readFile('src/viteval.eval.ts', 'utf8')).toContain(
        "evaluate('Uppercase'"
      );
      expect(await readFile('.viteval/.gitkeep', 'utf8')).toBe('');
    }
  );

  it('should use interactive prompt responses when no explicit choice is supplied', async () => {
    await writeFile('package.json', '{"type":"module"}');
    vi.spyOn(process.stdin, 'isTTY', 'get').mockReturnValue(true);
    const prompts = mockPrompts({ confirm: [true] }),
      result = await runHandler({ cmd: initCommand, overrides: { prompts } });
    expect(result.error).toBeUndefined();
    expect(prompts.confirm).toHaveBeenCalledOnce();
    expect(await readFile('.env', 'utf8')).toContain('OPENAI_API_KEY');
  });

  it.each([false, true])(
    'should safely reference relative and absolute env paths (absolute: %s)',
    async (absolute) => {
      await writeFile('package.json', '{"type":"module"}');
      const selected = absolute
          ? path.join(root, 'env %#.fixture')
          : 'config/env %#.fixture',
        result = await runHandler({
          cmd: initCommand,
          overrides: { args: { 'env-file': true, 'env-file-path': selected } },
        });
      expect(result.error).toBeUndefined();
      expect(await readFile('viteval.config.ts', 'utf8')).toContain(
        'env%20%25%23.fixture'
      );
      expect(await readFile(selected, 'utf8')).toBe('OPENAI_API_KEY=""\n');
    }
  );

  it('should preserve existing config, environment, starter, and results directory on repeated initialization', async () => {
    await writeFile('package.json', '{}');
    const first = await runHandler({
      cmd: initCommand,
      overrides: { args: { 'env-file': true } },
    });
    expect(first.error).toBeUndefined();
    await writeFile('viteval.config.mts', 'existing configuration');
    await writeFile('.env', 'SECRET="preserved"');
    const log = mockLog(),
      second = await runHandler({
        cmd: initCommand,
        overrides: { log, args: { 'env-file': true } },
      });
    expect(second.error).toBeUndefined();
    expect(log.info).toHaveBeenCalledWith(
      '.env file already exists, skipping...'
    );
    expect(await readFile('viteval.config.mts', 'utf8')).toBe(
      'existing configuration'
    );
    expect(await readFile('.env', 'utf8')).toBe('SECRET="preserved"');
  });

  it('should fail when the project manifest is missing', async () => {
    const result = await runHandler({ cmd: initCommand });
    expect(result.error?.message).toContain('Package.json does not exist');
  });

  it('should fail when the project manifest cannot be parsed', async () => {
    await writeFile('package.json', '{broken');
    const result = await runHandler({ cmd: initCommand });
    expect(result.error?.message).toContain('Failed to read package.json');
  });

  it.each([
    {
      blocked: 'block',
      args: { 'env-file': true, 'env-file-path': 'block/env' },
      message: 'Failed to create .env file',
    },
    {
      blocked: 'src',
      args: { 'env-file': false },
      message: 'Failed to create starter evaluation',
    },
    {
      blocked: '.viteval',
      args: { 'env-file': false },
      message: 'Failed to create .viteval',
    },
  ])(
    'should report filesystem failures for $blocked',
    async ({ blocked, args, message }) => {
      await writeFile('package.json', '{}');
      await writeFile(blocked, 'not a directory');
      const result = await runHandler({
        cmd: initCommand,
        overrides: { args },
      });
      expect(result.error?.message).toContain(message);
    }
  );

  it('should report inaccessible project metadata', async () => {
    await writeFile('package.json', '{}');
    vi.spyOn(process, 'cwd').mockReturnValue(root);
    await chmod(root, 0);
    try {
      const result = await runHandler({ cmd: initCommand });
      expect(result.error?.message).toContain('Failed to inspect project');
    } finally {
      await chmod(root, 0o755);
    }
  });

  it('should report inaccessible existing configuration files', async () => {
    await writeFile('package.json', '{}');
    await mkdir('restricted');
    await writeFile('restricted/config.ts', '');
    await symlink(path.join(root, 'restricted/config.ts'), 'viteval.config.ts');
    await chmod('restricted', 0);
    try {
      const result = await runHandler({ cmd: initCommand });
      expect(result.error?.message).toContain(
        'Failed to inspect Viteval configuration'
      );
    } finally {
      await chmod('restricted', 0o755);
    }
  });

  it('should report an unwritable configuration destination', async () => {
    await writeFile('package.json', '{}');
    await chmod(root, 0o555);
    try {
      const result = await runHandler({
        cmd: initCommand,
        overrides: { args: { 'env-file': false } },
      });
      expect(result.error?.message).toContain(
        'Failed to create viteval.config.mts'
      );
    } finally {
      await chmod(root, 0o755);
    }
  });
});
