import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const TEST_DIR = path.join(import.meta.dirname, '.test-cli-init');
const CLI_DIST = path.join(
  import.meta.dirname,
  '..',
  'cli',
  'dist',
  'index.mjs'
);

beforeAll(async () => {
  const distExists = await fs
    .access(CLI_DIST)
    .then(() => true)
    .catch(() => false);

  if (!distExists) {
    throw new Error(
      'CLI not built. Run `pnpm build` from the repository root before running tests.'
    );
  }
});

describe('init', () => {
  beforeAll(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });

    await fs.writeFile(
      path.join(TEST_DIR, 'package.json'),
      JSON.stringify({ name: 'test-project', version: '1.0.0' }, null, 2)
    );
  });

  afterAll(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  afterEach(async () => {
    await fs.rm(path.join(TEST_DIR, 'viteval.config.ts'), { force: true });
    await fs.rm(path.join(TEST_DIR, '.viteval'), {
      recursive: true,
      force: true,
    });
  });

  it('should create viteval.config.ts and .viteval directory', async () => {
    execSync('node ../cli.mjs init --no-env-file', {
      cwd: TEST_DIR,
      stdio: 'pipe',
    });

    const configExists = await fs
      .access(path.join(TEST_DIR, 'viteval.config.ts'))
      .then(() => true)
      .catch(() => false);
    expect(configExists).toBe(true);

    const dotDirExists = await fs
      .access(path.join(TEST_DIR, '.viteval'))
      .then(() => true)
      .catch(() => false);
    expect(dotDirExists).toBe(true);

    const gitkeepExists = await fs
      .access(path.join(TEST_DIR, '.viteval', '.gitkeep'))
      .then(() => true)
      .catch(() => false);
    expect(gitkeepExists).toBe(true);
  });

  it('should create .env and viteval.setup.ts when env file is enabled', async () => {
    execSync('node ../cli.mjs init --env-file', {
      cwd: TEST_DIR,
      stdio: 'pipe',
    });

    const envExists = await fs
      .access(path.join(TEST_DIR, '.env'))
      .then(() => true)
      .catch(() => false);
    expect(envExists).toBe(true);

    const setupExists = await fs
      .access(path.join(TEST_DIR, 'viteval.setup.ts'))
      .then(() => true)
      .catch(() => false);
    expect(setupExists).toBe(true);

    const configExists = await fs
      .access(path.join(TEST_DIR, 'viteval.config.ts'))
      .then(() => true)
      .catch(() => false);
    expect(configExists).toBe(true);
  });
});
