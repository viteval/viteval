import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { API } from 'typescript/unstable/sync';
import { afterEach, describe, expect, it } from 'vitest';
import { createCoverageArguments } from './coverage-fixture';

const CLI = path.resolve(import.meta.dirname, '../cli/dist/index.mjs'),
  projects: string[] = [];

afterEach(async () => {
  await Promise.all(
    projects
      .splice(0)
      .map((root) => fs.rm(root, { force: true, recursive: true }))
  );
});

describe('native CLI regressions', () => {
  it('should typecheck and run the generated V1 example without setup or reporters', async () => {
    const root = await createProject();
    const templates = path.resolve(
      import.meta.dirname,
      '../../tools/core/src/generators/files/example'
    );
    for (const entry of await fs.readdir(templates)) {
      if (entry.endsWith('.template')) continue;
      await fs.cp(path.join(templates, entry), path.join(root, entry), {
        recursive: true,
      });
    }
    const files = await fs.readdir(root);
    expect(files).not.toContain('vitest.config.ts');
    expect(files).not.toContain('viteval.setup.ts');
    expect(files).not.toContain('.env.example');
    const config = await fs.readFile(
      path.join(root, 'viteval.config.ts'),
      'utf8'
    );
    expect(config).not.toMatch(/setupFiles|reporters|vitest\/config/);
    const api = new API({ cwd: root });
    try {
      using snapshot = api.updateSnapshot({
        openProjects: [path.join(root, 'tsconfig.spec.json')],
      });
      const project = snapshot.getProject(
        path.join(root, 'tsconfig.spec.json')
      );
      expect(project).toBeDefined();
      if (!project)
        throw new Error('Generated TypeScript project could not be loaded');
      const diagnostics = [
        ...project.program.getConfigFileParsingDiagnostics(),
        ...project.program.getSyntacticDiagnostics(),
        ...project.program.getGlobalDiagnostics(),
        ...project.program.getProgramDiagnostics(),
        ...project.program.getSemanticDiagnostics(),
      ];
      expect(diagnostics).toEqual([]);
    } finally {
      api.close();
    }

    const generated = runCli({ root, args: ['data'] });
    expect(generated.status, generated.output).toBe(0);
    const dataset = JSON.parse(
      await fs.readFile(
        path.join(root, '.viteval/datasets/example.json'),
        'utf8'
      )
    );
    expect(dataset).toMatchObject({
      schemaVersion: 1,
      data: [
        { input: 'hello', expected: 'HELLO' },
        { input: 'world', expected: 'WORLD' },
        { input: 'viteval', expected: 'VITEVAL' },
      ],
    });
    const evaluated = runCli({ root, args: ['run'] });
    expect(evaluated.status, evaluated.output).toBe(0);
    const reports = await fs.readdir(path.join(root, '.viteval/results'));
    expect(reports).toHaveLength(1);
    expect(
      JSON.parse(
        await fs.readFile(
          path.join(root, '.viteval/results', reports[0]!),
          'utf8'
        )
      )
    ).toMatchObject({ schemaVersion: 1, success: true, numPassedEvals: 3 });
  }, 30_000);

  it.each([['--json'], ['--filesOnly']])(
    'should list evaluations without invoking paid tasks or scorers: %j',
    async (...options) => {
      const root = await createProject();
      await writeConfig({ root });
      await writeEval({
        root,
        source: `evaluate('collection only', {
  data: [{ input: 'q', expected: 'a' }],
  task: () => { throw new Error('paid task executed'); },
  scorers: [() => { throw new Error('paid scorer executed'); }],
});`,
      });
      const result = runCli({ root, args: ['list', ...options] });
      expect(result.status, result.output).toBe(0);
      expect(result.output).toContain('regression.eval.ts');
      expect(result.output).not.toContain('paid task executed');
      await expect(
        fs.access(path.join(root, '.viteval/results'))
      ).rejects.toThrow();
    }
  );

  it('should dispatch native benchmarks without executing evaluation tasks', async () => {
    const root = await createProject(),
      marker = path.join(root, 'bench-ran');
    await writeConfig({ root });
    await writeEval({
      root,
      source: `evaluate('not a benchmark', { data: [{ input: 'q', expected: 'a' }], task: () => { throw new Error('evaluation ran during bench'); }, scorers: [scorers.exactMatch()] });`,
    });
    await fs.writeFile(
      path.join(root, 'native.bench.ts'),
      `import { test } from 'vitest';
import { writeFileSync } from 'node:fs';
test('native benchmark', async ({ bench }) => {
  await bench('write marker', () => writeFileSync(${JSON.stringify(marker)}, 'ran')).run({ iterations: 1, time: 0, warmupTime: 0, warmupIterations: 0 });
});`
    );
    const result = runCli({ root, args: ['bench', '--run'] });
    expect(result.status, result.output).toBe(0);
    expect(await fs.readFile(marker, 'utf8')).toBe('ran');
    expect(result.output).not.toContain('evaluation ran during bench');
  });

  it.each([false, true])(
    'should use one effective discovery and persistence root (explicit CLI root: %s)',
    async (explicit) => {
      const root = await createProject(),
        effective = path.join(root, explicit ? 'override' : 'app');
      await fs.mkdir(effective);
      await writeConfig({ root, options: { root: './app' } });
      await writeEval({
        root: effective,
        source: `evaluate('rooted evaluation', { data: [{ input: 'q', expected: 'a' }], task: () => 'a', scorers: [scorers.exactMatch()], results: ['json'] });`,
      });
      const result = runCli({
        root,
        args: [
          'run',
          ...(explicit
            ? [
                '--root',
                path.relative(root, effective),
                '--config',
                path.join(root, 'viteval.config.ts'),
              ]
            : []),
        ],
      });
      expect(result.status, result.output).toBe(0);
      expect(
        await fs.readdir(path.join(effective, '.viteval/results'))
      ).not.toHaveLength(0);
      await expect(
        fs.access(path.join(root, '.viteval/results'))
      ).rejects.toThrow();
    }
  );

  it('should preserve mandatory exclusions when custom exclusions are configured', async () => {
    const root = await createProject();
    await writeConfig({
      root,
      options: { eval: { exclude: ['**/draft/**'] } },
    });
    await writeEval({
      root,
      source: `evaluate('safe evaluation', { data: [{ input: 'q', expected: 'a' }], task: () => 'a', scorers: [scorers.exactMatch()] });`,
    });
    for (const directory of ['node_modules/unsafe', '.git/unsafe', 'draft']) {
      const destination = path.join(root, directory);
      await fs.mkdir(destination, { recursive: true });
      await fs.writeFile(
        path.join(destination, 'ignored.eval.ts'),
        "throw new Error('excluded file executed');"
      );
    }
    const result = runCli({ root, args: ['run'] });
    expect(result.status, result.output).toBe(0);
    expect(result.output).not.toContain('excluded file executed');
  });

  it('should apply CLI retries ahead of project defaults and per-evaluation overrides ahead of CLI', async () => {
    const root = await createProject(),
      marker = path.join(root, 'retry-calls');
    await writeConfig({ root, options: { eval: { retries: 0 } } });
    await writeEval({
      root,
      source: `import { appendFileSync } from 'node:fs';
let calls = 0;
evaluate('CLI retry', { data: [{ input: 'q', expected: 'a' }], task: () => { if (++calls === 1) throw new Error('retry me'); return 'a'; }, scorers: [scorers.exactMatch()] });
evaluate('explicit override', { retries: 0, data: [{ input: 'q', expected: 'a' }], task: () => { appendFileSync(${JSON.stringify(marker)}, 'attempt\\n'); throw new Error('must run only once'); }, scorers: [scorers.exactMatch()] });`,
    });
    const result = runCli({
      root,
      args: [
        'run',
        '--retry',
        '1',
        '--reporter=json',
        `--outputFile.json=${path.join(root, 'report.json')}`,
      ],
    });
    expect(result.status, result.output).toBe(1);
    const report = JSON.parse(
      await fs.readFile(path.join(root, 'report.json'), 'utf8')
    );
    expect(report.numPassedTests).toBe(1);
    expect(report.numFailedTests).toBe(1);
    expect(await fs.readFile(marker, 'utf8')).toBe('attempt\n');
  });

  it.each(['1000', '0'])(
    'should apply CLI case timeouts ahead of project defaults: %s',
    async (timeout) => {
      const root = await createProject();
      await writeConfig({ root, options: { eval: { timeout: 1 } } });
      await writeEval({
        root,
        source: `evaluate('CLI timeout', { data: [{ input: 'q', expected: 'a' }], task: async () => { await new Promise(resolve => setTimeout(resolve, 30)); return 'a'; }, scorers: [scorers.exactMatch()] });`,
      });
      const result = runCli({ root, args: ['run', '--testTimeout', timeout] });
      expect(result.status, result.output).toBe(0);
    }
  );

  it('should apply CLI concurrency ahead of project defaults', async () => {
    const root = await createProject();
    await writeConfig({ root, options: { eval: { concurrency: 1 } } });
    await writeEval({
      root,
      source: `let active = 0;
let peak = 0;
evaluate('CLI concurrency', { data: [{ input: 'q', expected: 'a' }, { input: 'q', expected: 'a' }], task: async () => { active++; peak = Math.max(peak, active); await new Promise(resolve => setTimeout(resolve, 50)); active--; if (peak !== 2) throw new Error('CLI concurrency was ignored'); return 'a'; }, scorers: [scorers.exactMatch()] });`,
    });
    const result = runCli({ root, args: ['run', '--maxConcurrency', '2'] });
    expect(result.status, result.output).toBe(0);
  });
});

async function createProject() {
  const root = await fs.mkdtemp(
    path.join(import.meta.dirname, '.test-cli-regression-')
  );
  projects.push(root);
  await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}');
  await fs.mkdir(path.join(root, 'node_modules'));
  await fs.symlink(
    import.meta.dirname,
    path.join(root, 'node_modules/viteval'),
    'dir'
  );
  return root;
}

async function writeConfig({
  root,
  options = {},
}: {
  root: string;
  options?: Record<string, unknown>;
}) {
  await fs.writeFile(
    path.join(root, 'viteval.config.ts'),
    `import { defineConfig } from 'viteval/config';\nexport default defineConfig(${JSON.stringify(options)});`
  );
}

async function writeEval({ root, source }: { root: string; source: string }) {
  await fs.writeFile(
    path.join(root, 'regression.eval.ts'),
    `import { evaluate, scorers } from 'viteval';\n${source}`
  );
}

function runCli({ root, args }: { root: string; args: string[] }) {
  const binary = process.env.VITEVAL_TEST_BINARY,
    effectiveArgs = [
      ...args,
      ...(args[0] === 'run' ? createCoverageArguments() : []),
    ],
    result = spawnSync(
      binary ?? process.execPath,
      binary ? effectiveArgs : [CLI, ...effectiveArgs],
      { cwd: root, encoding: 'utf8', timeout: 15_000 }
    );
  if (result.error) throw result.error;
  return { ...result, output: `${result.stdout}${result.stderr}` };
}
