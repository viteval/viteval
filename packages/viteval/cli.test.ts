import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const TEST_DIR = path.join(import.meta.dirname, '.test-cli-init');
const DATA_TEST_DIR = path.join(import.meta.dirname, '.test-cli-data');
const RUN_TEST_DIR = path.join(import.meta.dirname, '.test-cli-run');
const CLI_DIST = path.join(
  import.meta.dirname,
  '..',
  'cli',
  'dist',
  'index.mjs'
);
const CLI_BINARY = process.env.VITEVAL_TEST_BINARY;
const BASIC_EXAMPLE = path.join(
  import.meta.dirname,
  '..',
  '..',
  'examples',
  'basic'
);

beforeAll(async () => {
  const distExists = await fs
    .access(CLI_DIST)
    .then(() => true)
    .catch(() => false);

  expect(
    distExists,
    'CLI not built. Run `pnpm build` from the repository root before running tests.'
  ).toBe(true);
});

describe('help', () => {
  it('should list Viteval commands without loading an evaluation project', () => {
    const result = runCli({ args: ['--help'] });
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
    for (const name of ['run', 'init', 'data', 'ui']) {
      expect(result.stdout).toContain(`viteval ${name}`);
    }
  });

  it('should report the Viteval package version', async () => {
    const result = runCli({ args: ['--version'] });
    const manifest = JSON.parse(
      await fs.readFile(new URL('./package.json', import.meta.url), 'utf8')
    );
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(manifest.version);
  });

  it('should preserve the native Vitest help for evaluation commands', () => {
    const result = runCli({ args: ['run', '--help', '--root', BASIC_EXAMPLE] });
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
    expect(result.stdout).toContain('--reporter');
    expect(result.stdout).toContain('--project');
  });
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
    await fs.rm(TEST_DIR, { force: true, recursive: true });
  });

  afterEach(async () => {
    await fs.rm(path.join(TEST_DIR, 'vitest.config.ts'), { force: true });
    await fs.rm(path.join(TEST_DIR, 'viteval.setup.ts'), { force: true });
    await fs.rm(path.join(TEST_DIR, '.env'), { force: true });
    await fs.rm(path.join(TEST_DIR, '.viteval'), {
      force: true,
      recursive: true,
    });
  });

  it('should create vitest.config.ts and .viteval directory', async () => {
    const result = runCli({ args: ['init', '--no-env-file'], cwd: TEST_DIR });
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);

    const configExists = await fs
      .access(path.join(TEST_DIR, 'vitest.config.ts'))
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
    const result = runCli({ args: ['init', '--env-file'], cwd: TEST_DIR });
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);

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
      .access(path.join(TEST_DIR, 'vitest.config.ts'))
      .then(() => true)
      .catch(() => false);
    expect(configExists).toBe(true);

    const setup = await fs.readFile(
      path.join(TEST_DIR, 'viteval.setup.ts'),
      'utf8'
    );
    expect(setup).toContain('new URL(');
    expect(setup).toContain('.env');
  });

  it('should initialize noninteractively without creating an env file', async () => {
    const result = runCli({ args: ['init'], cwd: TEST_DIR });
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
    expect(
      await fs.readFile(path.join(TEST_DIR, 'viteval.setup.ts'), 'utf8')
    ).toContain('createJsonProvider');
    await expect(fs.access(path.join(TEST_DIR, '.env'))).rejects.toThrow();
  });

  it('should initialize outside the workspace without project dependencies', async () => {
    const project = await fs.mkdtemp(path.join(tmpdir(), 'viteval-init-'));
    try {
      await fs.writeFile(
        path.join(project, 'package.json'),
        JSON.stringify({ name: 'new-project', version: '1.0.0' })
      );
      const result = runCli({ args: ['init', '--no-env-file'], cwd: project });
      expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
      const config = await fs.readFile(
        path.join(project, 'vitest.config.ts'),
        'utf8'
      );
      expect(config).toContain("from 'viteval/reporters'");
      expect(config).toContain('.viteval/results/<run>.json');
    } finally {
      await fs.rm(project, { recursive: true, force: true });
    }
  });

  it('should preserve existing configuration on repeated initialization', async () => {
    const configPath = path.join(TEST_DIR, 'vitest.config.ts');
    const existingConfig = 'export default { test: { retry: 2 } };\n';
    await fs.writeFile(configPath, existingConfig);
    const result = runCli({ args: ['init', '--no-env-file'], cwd: TEST_DIR });
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
    expect(await fs.readFile(configPath, 'utf8')).toBe(existingConfig);
  });

  it('should reject unknown initialization flags', () => {
    const result = runCli({
      args: ['init', '--unknown-option'],
      cwd: TEST_DIR,
    });
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain('Unknown argument');
  });

  it('should fail when the selected directory has no package.json', async () => {
    const missingProject = path.join(TEST_DIR, 'missing-project');
    await fs.mkdir(missingProject, { recursive: true });
    const result = runCli({
      args: ['init', '--no-env-file'],
      cwd: missingProject,
    });
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'Package.json does not exist'
    );
  });
});

describe('data', () => {
  beforeAll(async () => {
    await fs.mkdir(DATA_TEST_DIR, { recursive: true });
    await fs.writeFile(
      path.join(DATA_TEST_DIR, 'vitest.config.ts'),
      "import { defineConfig } from 'viteval/config';\n\nexport default defineConfig({});\n"
    );
    await fs.writeFile(
      path.join(DATA_TEST_DIR, 'rooted.dataset.ts'),
      [
        "import { defineDataset } from 'viteval/dataset';",
        '',
        'export default defineDataset({',
        "  name: 'rooted',",
        "  data: async () => [{ input: 'question', expected: 'answer' }],",
        '});',
        '',
      ].join('\n')
    );
  });

  afterAll(async () => {
    await fs.rm(DATA_TEST_DIR, { force: true, recursive: true });
  });

  it('writes datasets under the selected Vitest root', async () => {
    const result = runCli({
      args: ['data', '--root', DATA_TEST_DIR, '--overwrite'],
    });

    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
    const dataset = JSON.parse(
      await fs.readFile(
        path.join(DATA_TEST_DIR, '.viteval', 'datasets', 'rooted.json'),
        'utf8'
      )
    );
    expect(dataset.data).toEqual([{ expected: 'answer', input: 'question' }]);
  });

  it('rejects an unknown Vitest project', () => {
    const result = runCli({
      args: ['data', '--root', DATA_TEST_DIR, '--project', 'missing'],
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'Vitest project "missing" was not found'
    );
  });

  it('should discover named exports and generate aliased datasets only once', async () => {
    await fs.writeFile(
      path.join(DATA_TEST_DIR, 'named.dataset.ts'),
      `import { defineDataset } from 'viteval/dataset';
let calls = 0;
export const first = defineDataset({ name: 'named-first', data: async () => {
  if (++calls !== 1) throw new Error('generated more than once');
  return [{ input: 'first', expected: 'answer' }];
} });
export { first as alias, first as default };
export const second = defineDataset({ name: 'named-second', data: async () => [{ input: 'second', expected: 'answer' }] });
export const metadata = { name: 'not a dataset' };`
    );
    const result = runCli({
      args: [
        'data',
        'named.dataset.ts',
        '--root',
        DATA_TEST_DIR,
        '--overwrite',
      ],
    });
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'Generated 2 datasets'
    );
    for (const name of ['named-first', 'named-second']) {
      const saved = JSON.parse(
        await fs.readFile(
          path.join(DATA_TEST_DIR, '.viteval', 'datasets', `${name}.json`),
          'utf8'
        )
      );
      expect(saved.data).toHaveLength(1);
    }
  });

  it('should discover inline eval-file datasets without executing tasks, scorers, or ordinary tests', async () => {
    await fs.writeFile(
      path.join(DATA_TEST_DIR, 'inline.eval.ts'),
      `import { evaluate } from 'viteval';
import { defineDataset } from 'viteval/dataset';
import { test } from 'vitest';
let calls = 0;
const dataset = defineDataset({ name: 'inline-eval', data: async () => {
  if (++calls !== 1) throw new Error('dataset loaded during collection');
  return [{ input: 'inline', expected: 'answer' }];
} });
evaluate('must not run evals', { data: dataset, task: () => { throw new Error('eval task ran'); }, scorers: [() => { throw new Error('eval scorer ran'); }] });
evaluate('must not load generators', { data: async () => { throw new Error('eval generator ran'); }, task: () => 'answer', scorers: [] });
test('ordinary test', () => { throw new Error('ordinary test ran'); });`
    );
    const result = runCli({
      args: ['data', 'inline.eval.ts', '--root', DATA_TEST_DIR, '--overwrite'],
    });
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'Generated 1 datasets'
    );
    const saved = JSON.parse(
      await fs.readFile(
        path.join(DATA_TEST_DIR, '.viteval', 'datasets', 'inline-eval.json'),
        'utf8'
      )
    );
    expect(saved.data).toEqual([{ input: 'inline', expected: 'answer' }]);

    await fs.writeFile(
      path.join(DATA_TEST_DIR, 'inline.config.ts'),
      "export default { test: { include: ['inline.eval.ts'] } };"
    );
    const evaluation = runCli({
      args: [
        'run',
        'inline.eval.ts',
        '--root',
        DATA_TEST_DIR,
        '--config',
        'inline.config.ts',
      ],
    });
    expect(evaluation.status).toBe(1);
    expect(`${evaluation.stdout}${evaluation.stderr}`).toContain(
      'eval task ran'
    );
  });

  it('should include eval files in default dataset discovery', async () => {
    const root = path.join(DATA_TEST_DIR, 'default-discovery');
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(
      path.join(root, 'vitest.config.ts'),
      'export default {};'
    );
    await fs.writeFile(
      path.join(root, 'questions.eval.ts'),
      `import { evaluate } from 'viteval';
import { defineDataset } from 'viteval/dataset';
export const dataset = defineDataset({ name: 'default-eval', data: async () => [{ input: 'q', expected: 'a' }] });
evaluate('questions', { data: dataset, task: () => { throw new Error('task ran'); }, scorers: [] });`
    );
    const result = runCli({ args: ['data', '--root', root] });
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
    expect(await fs.readdir(path.join(root, '.viteval', 'datasets'))).toEqual([
      'default-eval.json',
    ]);
  });

  it('should deduplicate a dataset re-exported from multiple modules', async () => {
    await fs.writeFile(
      path.join(DATA_TEST_DIR, 'shared-source.ts'),
      `import { defineDataset } from 'viteval/dataset';
let calls = 0;
export const shared = defineDataset({ name: 'shared-discovery', data: async () => {
  if (++calls !== 1) throw new Error('shared dataset generated twice');
  return [{ input: 'shared', expected: 'answer' }];
} });`
    );
    for (const name of ['shared-first', 'shared-second']) {
      await fs.writeFile(
        path.join(DATA_TEST_DIR, `${name}.dataset.ts`),
        "export { shared } from './shared-source';"
      );
    }
    const result = runCli({
      args: [
        'data',
        'shared-*.dataset.ts',
        '--root',
        DATA_TEST_DIR,
        '--overwrite',
      ],
    });
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'Generated 1 datasets'
    );
  });

  it('should discover eval datasets already initialized by setup files', async () => {
    const root = path.join(DATA_TEST_DIR, 'setup-discovery');
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(
      path.join(root, 'vitest.config.ts'),
      "export default { test: { setupFiles: ['./datasets.setup.ts'] } };"
    );
    await fs.writeFile(
      path.join(root, 'datasets.setup.ts'),
      `import { defineDataset } from 'viteval/dataset';
import { afterAll } from 'vitest';
export const dataset = defineDataset({ name: 'setup-discovery', data: async () => [{ input: 'setup', expected: 'answer' }] });
afterAll(() => { if (globalThis.__viteval_datasetDiscovery) throw new Error('dataset discovery leaked'); });`
    );
    await fs.writeFile(
      path.join(root, 'questions.eval.ts'),
      `import { evaluate } from 'viteval';
import { dataset } from './datasets.setup';
evaluate('questions', { data: dataset, task: () => { throw new Error('task ran'); }, scorers: [] });`
    );
    const result = runCli({ args: ['data', '--root', root] });
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
    const saved = JSON.parse(
      await fs.readFile(
        path.join(root, '.viteval', 'datasets', 'setup-discovery.json'),
        'utf8'
      )
    );
    expect(saved.data).toEqual([{ input: 'setup', expected: 'answer' }]);
  });

  it('should reject distinct datasets with the same name before writing either', async () => {
    for (const name of ['duplicate-first', 'duplicate-second']) {
      await fs.writeFile(
        path.join(DATA_TEST_DIR, `${name}.dataset.ts`),
        `import { defineDataset } from 'viteval/dataset';
export const dataset = defineDataset({ name: 'duplicate-discovery', data: async () => [{ input: '${name}', expected: 'a' }] });`
      );
    }
    const result = runCli({
      args: ['data', 'duplicate-*.dataset.ts', '--root', DATA_TEST_DIR, '-V'],
    });
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'Distinct datasets share the same name: duplicate-discovery'
    );
    await expect(
      fs.access(
        path.join(
          DATA_TEST_DIR,
          '.viteval',
          'datasets',
          'duplicate-discovery.json'
        )
      )
    ).rejects.toThrow();
  });

  it('should discard datasets from modules that fail during import', async () => {
    await fs.writeFile(
      path.join(DATA_TEST_DIR, 'broken-import.dataset.ts'),
      `import { defineDataset } from 'viteval/dataset';
export const dataset = defineDataset({ name: 'broken-import', data: async () => [{ input: 'q', expected: 'a' }] });
throw new Error('module import exploded');`
    );
    const result = runCli({
      args: ['data', 'broken-import.dataset.ts', '--root', DATA_TEST_DIR, '-V'],
    });
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'module import exploded'
    );
    await expect(
      fs.access(
        path.join(DATA_TEST_DIR, '.viteval', 'datasets', 'broken-import.json')
      )
    ).rejects.toThrow();
  });

  it('should reject matched dataset modules without a dataset', async () => {
    await fs.writeFile(
      path.join(DATA_TEST_DIR, 'empty.dataset.ts'),
      "export const metadata = { name: 'not a dataset' };"
    );
    const result = runCli({
      args: ['data', 'empty.dataset.ts', '--root', DATA_TEST_DIR, '-V'],
    });
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'Dataset modules must define or export a defineDataset() result'
    );
  });

  it('should generate memory datasets discovered in eval files without persisting them', async () => {
    await fs.writeFile(
      path.join(DATA_TEST_DIR, 'memory.eval.ts'),
      `import { evaluate } from 'viteval';
import { defineDataset } from 'viteval/dataset';
import { writeFile } from 'node:fs/promises';
const dataset = defineDataset({ name: 'memory-discovery', storage: 'memory', data: async () => {
  await writeFile(${JSON.stringify(path.join(DATA_TEST_DIR, 'memory-generated.txt'))}, 'generated');
  return [{ input: 'q', expected: 'a' }];
} });
evaluate('memory eval', { data: dataset, task: () => { throw new Error('task ran'); }, scorers: [] });`
    );
    const result = runCli({
      args: ['data', 'memory.eval.ts', '--root', DATA_TEST_DIR],
    });
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
    expect(
      await fs.readFile(
        path.join(DATA_TEST_DIR, 'memory-generated.txt'),
        'utf8'
      )
    ).toBe('generated');
    await expect(
      fs.access(
        path.join(
          DATA_TEST_DIR,
          '.viteval',
          'datasets',
          'memory-discovery.json'
        )
      )
    ).rejects.toThrow();
  });

  it('should report when matched eval modules contain no datasets', async () => {
    await fs.writeFile(
      path.join(DATA_TEST_DIR, 'no-dataset.eval.ts'),
      `import { evaluate } from 'viteval';
evaluate('array data', { data: [{ input: 'q', expected: 'a' }], task: () => { throw new Error('task ran'); }, scorers: [] });`
    );
    const result = runCli({
      args: ['data', 'no-dataset.eval.ts', '--root', DATA_TEST_DIR, '-V'],
    });
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'No datasets defined in the matched modules'
    );
  });

  it('should preserve dataset contents when overwrite is disabled', async () => {
    const datasetPath = path.join(
      DATA_TEST_DIR,
      '.viteval',
      'datasets',
      'rooted.json'
    );
    await fs.mkdir(path.dirname(datasetPath), { recursive: true });
    const original = JSON.stringify({
      data: [{ input: 'original', expected: 'answer' }],
    });
    await fs.writeFile(datasetPath, original);
    const result = runCli({
      args: ['data', 'rooted.dataset.ts', '--root', DATA_TEST_DIR],
    });
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
    expect(await fs.readFile(datasetPath, 'utf8')).toBe(original);
    expect(`${result.stdout}${result.stderr}`).toContain('Skipped 1 datasets');
  });

  it('should apply maltty working-directory overrides once', async () => {
    const result = runCli({
      args: [
        '--cwd',
        path.basename(DATA_TEST_DIR),
        'data',
        'rooted.dataset.ts',
        '--overwrite',
      ],
      cwd: import.meta.dirname,
    });
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
    expect(
      JSON.parse(
        await fs.readFile(
          path.join(DATA_TEST_DIR, '.viteval', 'datasets', 'rooted.json'),
          'utf8'
        )
      ).data
    ).toEqual([{ input: 'question', expected: 'answer' }]);
  });

  it('should return a failure and diagnostics when generation rejects', async () => {
    const datasetPath = path.join(DATA_TEST_DIR, 'failing.dataset.ts');
    await fs.writeFile(
      datasetPath,
      [
        "import { defineDataset } from 'viteval/dataset';",
        "export default defineDataset({ name: 'failing', data: async () => { throw new Error('dataset exploded'); } });",
      ].join('\n')
    );
    const result = runCli({
      args: ['data', 'failing.dataset.ts', '--root', DATA_TEST_DIR, '-V'],
    });
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain('dataset exploded');
  });

  it('should support dataset setup modules with native Vitest lifecycle hooks', async () => {
    const config = path.join(DATA_TEST_DIR, 'vitest.config.ts');
    const original = await fs.readFile(config, 'utf8');
    await fs.writeFile(
      path.join(DATA_TEST_DIR, 'hooks.setup.ts'),
      "import { afterAll } from 'vitest';\nafterAll(() => { if (globalThis.__viteval_datasetDiscovery) throw new Error('dataset discovery leaked'); });\n"
    );
    await fs.writeFile(
      config,
      "export default { test: { setupFiles: ['./hooks.setup.ts'] } };\n"
    );
    try {
      const result = runCli({
        args: [
          'data',
          'rooted.dataset.ts',
          '--root',
          DATA_TEST_DIR,
          '--overwrite',
        ],
      });
      expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
    } finally {
      await fs.writeFile(config, original);
    }
  });
});

describe('run', () => {
  beforeAll(async () => {
    await fs.mkdir(RUN_TEST_DIR, { recursive: true });
    await fs.writeFile(
      path.join(RUN_TEST_DIR, 'vitest.config.ts'),
      "export default { test: { include: ['failure.eval.ts'] } };\n"
    );
    await fs.writeFile(
      path.join(RUN_TEST_DIR, 'failure.eval.ts'),
      "import { evaluate, scorers } from 'viteval';\nevaluate('regression', { data: [{ input: 'q', expected: 'expected' }], task: () => 'different', scorers: [scorers.exactMatch()] });\n"
    );
  });
  afterAll(async () => {
    await fs.rm(RUN_TEST_DIR, { force: true, recursive: true });
  });
  it('delegates filters and options to the native Vitest CLI', () => {
    const result = runCli({
      args: [
        'run',
        '--root',
        RUN_TEST_DIR,
        '--reporter=dot',
        '--testTimeout=10000',
      ],
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'mean score 0 is below threshold 1'
    );
  });
});

describe('ui', () => {
  it(
    'should serve project results and shut down on SIGTERM',
    { timeout: 15_000 },
    async () => {
      const project = await fs.mkdtemp(path.join(tmpdir(), 'viteval-ui-'));
      const args = ['ui', '--root', project];
      const child = spawn(
        CLI_BINARY ?? process.execPath,
        CLI_BINARY ? args : [CLI_DIST, ...args],
        {
          stdio: 'pipe',
        }
      );
      const exited = new Promise<number | null>((resolve, reject) => {
        child.once('error', reject);
        child.once('exit', resolve);
      });
      let logs = '';
      let readyTimer: ReturnType<typeof setTimeout> | undefined;
      try {
        const url = await new Promise<string>((resolve, reject) => {
          readyTimer = setTimeout(
            () => reject(new Error(`UI startup timed out: ${logs}`)),
            10_000
          );
          const onData = (chunk: Buffer) => {
            logs += chunk.toString();
            const match = logs.match(/http:\/\/localhost:\d+/);
            if (match) {
              resolve(match[0]);
            }
          };
          child.stdout.on('data', onData);
          child.stderr.on('data', onData);
          exited.then(
            (code) => reject(new Error(`UI exited with ${code}: ${logs}`)),
            reject
          );
        });
        clearTimeout(readyTimer);
        const response = await fetch(`${url}/api/results`);
        expect(response.status, logs).toBe(200);
        expect(await response.json()).toMatchObject({ data: [], total: 0 });
        const page = await fetch(`${url}/results`);
        expect(page.status, logs).toBe(200);
        expect(page.headers.get('content-type')).toMatch(/text\/html/);
        const html = await page.text();
        const renderedText = html
          .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, '');
        expect(renderedText).toContain('No results.');
        expect(renderedText).toContain(
          'View and analyze your evaluation results (0 total)'
        );
        const assets = [
          ...new Set(
            [
              ...html.matchAll(
                /["']([^"'<>]*\/assets\/[^"'<>]+\.(?:js|css)(?:\?[^"'<>]*)?)["']/g
              ),
            ].map((match) => match[1].replaceAll('&amp;', '&'))
          ),
        ];
        for (const extension of ['js', 'css']) {
          const asset = assets.find((candidate) =>
            new URL(candidate, url).pathname.endsWith(`.${extension}`)
          );
          if (!asset) {
            throw new Error(`Missing compiled Vite ${extension} asset`);
          }
          const assetResponse = await fetch(new URL(asset, url));
          expect(assetResponse.status, asset).toBe(200);
          expect(assetResponse.headers.get('content-type')).toMatch(
            extension === 'css'
              ? /text\/css/
              : /(?:text|application)\/javascript/
          );
          expect((await assetResponse.text()).trim().length).toBeGreaterThan(0);
        }
        const missing = await fetch(`${url}/missing-dashboard-page`);
        expect(missing.status).toBe(404);
        expect(await missing.text()).toMatch(/not found/i);
        const missingResult = await fetch(`${url}/api/results/missing`);
        expect(missingResult.status).toBe(404);
        expect(await missingResult.json()).toEqual({ error: 'Not found' });
        child.kill('SIGTERM');
        expect(await exited, logs).toBe(0);
        await expect(fetch(`${url}/api/results`)).rejects.toThrow();
      } finally {
        clearTimeout(readyTimer);
        child.kill('SIGTERM');
        await exited;
        await fs.rm(project, { recursive: true, force: true });
      }
    }
  );
});

function runCli({ args, cwd }: { args: string[]; cwd?: string }) {
  return spawnSync(
    CLI_BINARY ?? process.execPath,
    CLI_BINARY ? args : [CLI_DIST, ...args],
    {
      cwd,
      encoding: 'utf8',
      timeout: 10_000,
    }
  );
}
