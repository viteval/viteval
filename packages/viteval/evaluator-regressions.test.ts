import { spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJsonProvider } from '@viteval/core/provider';
import { EVAL_RESULTS_SCHEMA } from '@viteval/core/reporters';
import { afterAll, describe, expect, it } from 'vitest';
import { createCoverageArguments } from './coverage-fixture';

const ROOT = path.join(import.meta.dirname, '.test-evaluator-regressions'),
  ENGINE = fileURLToPath(
    new URL('vitest.mjs', import.meta.resolve('vitest/package.json'))
  );
let sequence = 0;

afterAll(async () => {
  await rm(ROOT, { recursive: true, force: true });
});

describe('evaluator lifecycle regressions', () => {
  it('should not execute a queued case that expired during slower task cleanup', async () => {
    const result = await run({
      evaluation: `import { beforeEach, afterAll } from 'vitest';
const finishers = new Map();
const started = [];
beforeEach((context) => { finishers.set(context.task.name, context.onTestFinished); });
afterAll(() => {
  if (started.includes(2)) throw new Error('expired queued task executed');
});
evaluate('expired queue', { concurrency: 2, timeout: 30,
  data: [0, 1, 2].map((input) => ({ name: 'case-' + input, input, expected: input })),
  task: ({ input }) => {
    started.push(input);
    finishers.get('case-' + input)(() => new Promise((resolve) => setTimeout(resolve, 100)));
    return new Promise(() => {});
  }, scorers: [scorers.exactMatch()] });`,
    });
    expect(result.status, result.logs).toBe(1);
    expect(result.logs).not.toContain('expired queued task executed');
    expect((await storedRuns(result.root))[0]).toMatchObject({
      status: 'failed',
      summary: { failedCount: 3 },
    });
  });

  it('should preserve a runtime skip requested from the evaluation task', async () => {
    const result = await run({
      evaluation: `import { beforeEach } from 'vitest';
let skip;
beforeEach((context) => { skip = () => context.skip('runtime skip'); });
evaluate('runtime skipped case', { concurrency: 1,
  data: [{ input: 'q', expected: 'a' }], task: () => skip(),
  scorers: [scorers.exactMatch()] });`,
    });
    expect(result.status, result.logs).toBe(0);
    expect((await storedRuns(result.root))[0]).toMatchObject({
      results: [{ metadata: { state: 'skipped' } }],
    });
  });

  it('should retain suite-local hook errors in persisted results', async () => {
    const result = await run({
      evaluation: `import { beforeAll } from 'vitest';
evaluate('suite-local failure', { data: () => {
  beforeAll(() => { throw new Error('suite setup rejected'); });
  return [{ input: 'q', expected: 'a' }];
}, task: () => 'a', scorers: [scorers.exactMatch()] });`,
    });
    expect(result.status, result.logs).toBe(1);
    expect((await storedRuns(result.root))[0]).toMatchObject({
      status: 'failed',
      results: [
        {
          metadata: {
            executionError: expect.stringContaining('suite setup rejected'),
          },
        },
      ],
    });
  });

  it('should finish healthy destinations when another result write is rejected', async () => {
    const result = await run({
      config: `const broken = createProvider({ ...json, name: 'broken', evals: { ...json.evals,
  addResult: async () => ({ ok: false, error: new Error('result write rejected') })
} });
export default defineConfig({ providers: [broken, json], eval: { results: ['broken', 'json'] } });`,
      evaluation: `evaluate('result failure', { data: [{ input: 'q', expected: 'a' }], task: () => 'a', scorers: [scorers.exactMatch()] });`,
    });
    expect(result.status, result.logs).toBe(1);
    expect(result.logs).toContain('result write rejected');
    expect(
      (await storedRuns(result.root)).some((run) => run.status === 'completed')
    ).toBe(true);
  });

  it('should retain non-Error provider rejections', async () => {
    const result = await run({
      config: `const broken = createProvider({ ...json, name: 'broken', evals: { ...json.evals,
  create: async () => { throw 'non-error create rejection'; }
} });
export default defineConfig({ providers: [broken, json], eval: { results: ['broken', 'json'] } });`,
      evaluation: `evaluate('non-error failure', { data: [{ input: 'q', expected: 'a' }], task: () => 'a', scorers: [scorers.exactMatch()] });`,
    });
    expect(result.status, result.logs).toBe(1);
    expect(result.logs).toContain('non-error create rejection');
  });

  it('should retain a non-Error suite rejection alongside persistence errors', async () => {
    const result = await run({
      config: `const broken = createProvider({ ...json, name: 'broken', evals: { ...json.evals,
  complete: async () => ({ ok: false, error: new Error('finalization rejected') })
} });
export default defineConfig({ providers: [broken, json], eval: { results: ['broken', 'json'] } });`,
      evaluation: `import { aroundAll } from 'vitest';
evaluate('non-error suite', { data: [{ input: 'q', expected: 'a' }], task: () => 'a', scorers: [scorers.exactMatch()] });
aroundAll(async (runSuite) => { await runSuite(); throw 'non-error suite rejection'; });`,
    });
    expect(result.status, result.logs).toBe(1);
    expect(result.logs).toContain('finalization rejected');
    expect(result.logs).toContain('non-error suite rejection');
  });

  it.each(['task-result', 'task-error', 'scorer-result'])(
    'should ignore a late %s after its case times out',
    async (scenario) => {
      const result = await run({
        evaluation: `import { afterAll } from 'vitest';
afterAll(() => new Promise((resolve) => setTimeout(resolve, 120)));
const delay = () => new Promise((resolve) => setTimeout(resolve, 60));
evaluate('late completion', { timeout: 20,
  data: [{ input: 'q', expected: 'a' }],
  task: async () => { ${scenario === 'scorer-result' ? '' : 'await delay();'} ${scenario === 'task-error' ? "throw new Error('late task failure');" : "return 'a';"} },
  scorers: [async () => { ${scenario === 'scorer-result' ? 'await delay();' : ''} return { name: 'late', score: 1 }; }] });`,
      });
      expect(result.status, result.logs).toBe(1);
      expect(result.report.numFailedEvals).toBe(1);
      expect((await storedRuns(result.root))[0]).toMatchObject({
        status: 'failed',
        results: [{ passed: false, output: null }],
      });
    }
  );

  it.each(['error', 'empty'])(
    'should report a generated dataset load returning %s',
    async (scenario) => {
      const result = await run({
        evaluation: `evaluate('dataset result', {
  data: { load: async () => ${scenario === 'error' ? "({ ok: false, error: new Error('dataset load rejected') })" : '({ ok: true, value: null })'} },
  task: () => 'a', scorers: [scorers.exactMatch()] });`,
      });
      expect(result.status, result.logs).toBe(1);
      expect(result.logs).toContain(
        scenario === 'error'
          ? 'dataset load rejected'
          : 'Dataset returned no data'
      );
    }
  );

  it('should release a hanging attempt before retrying it', async () => {
    const result = await run({
      evaluation: `let attempts = 0;
evaluate('hanging retry', { concurrency: 1, timeout: 80, retries: 1,
  data: [{ input: 'answer', expected: 'answer' }],
  task: ({ input }) => ++attempts === 1 ? new Promise(() => {}) : input,
  scorers: [scorers.exactMatch()] });`,
    });
    expect(result.status, result.logs).toBe(0);
    expect(result.report).toMatchObject({ numPassedEvals: 1, success: true });
    expect((await storedRuns(result.root))[0]).toMatchObject({
      status: 'completed',
      results: [{ output: 'answer', passed: true }],
    });
  });

  it('should let queued and later cases progress after hanging tasks time out', async () => {
    const result = await run({
      evaluation: `evaluate('hanging cases', { concurrency: 2, timeout: 100,
  data: Array.from({ length: 9 }, (_, input) => ({ input, expected: input })),
  task: ({ input }) => input < 2 ? new Promise(() => {}) : input,
  scorers: [scorers.exactMatch()] });`,
    });
    expect(result.status, result.logs).toBe(1);
    expect(result.report.numPassedEvals, result.logs).toBeGreaterThanOrEqual(4);
    const runs = await storedRuns(result.root);
    expect(runs[0].status).toBe('failed');
    expect(runs[0].results).toHaveLength(9);
    expect(runs[0].results?.find((item) => item.input === 8)).toMatchObject({
      output: 8,
      passed: true,
    });
  });

  it.each(['return', 'throw'])(
    'should finalize healthy destinations when another create operation fails by %s',
    async (mode) => {
      const result = await run({
        config: `const broken = createProvider({ ...json, name: 'broken', evals: { ...json.evals,
  create: async () => { ${mode === 'throw' ? "throw new Error('create rejected')" : "return { ok: false, error: new Error('create rejected') }"}; }
} });
export default defineConfig({ providers: [broken, json], eval: { results: ['broken', 'json'] } });`,
        evaluation: `evaluate('partial creation', { data: [{ input: 'q', expected: 'a' }],
  task: () => { throw new Error('must not execute task'); }, scorers: [scorers.exactMatch()] });`,
      });
      expect(result.status, result.logs).toBe(1);
      expect(result.logs).toContain('create rejected');
      expect(result.logs).not.toContain('must not execute task');
      expect((await storedRuns(result.root))[0]).toMatchObject({
        status: 'failed',
        summary: { passed: false, passedCount: 0, failedCount: 1 },
        results: [
          {
            passed: false,
            metadata: {
              executionError: expect.stringContaining('create rejected'),
            },
          },
        ],
      });
    }
  );

  it('should retain original create errors when cleanup also fails', async () => {
    const result = await run({
      config: `const broken = createProvider({ ...json, name: 'broken', evals: { ...json.evals,
  create: async () => ({ ok: false, error: new Error('original create failure') })
} });
const cleanup = createProvider({ ...json, name: 'cleanup', evals: { ...json.evals,
  complete: async () => ({ ok: false, error: new Error('cleanup failure') })
} });
export default defineConfig({ providers: [broken, cleanup, json], eval: { results: ['broken', 'cleanup', 'json'] } });`,
      evaluation: `evaluate('double failure', { data: [{ input: 'q', expected: 'a' }], task: () => 'a', scorers: [scorers.exactMatch()] });`,
    });
    expect(result.status, result.logs).toBe(1);
    expect(result.logs).toContain('original create failure');
    expect(result.logs).toContain('cleanup failure');
    expect(
      (await storedRuns(result.root)).some((run) => run.status === 'failed')
    ).toBe(true);
  });

  it('should report a missing DatasetReference as a data-loading failure', async () => {
    const result = await run({
      evaluation: `evaluate('missing reference', { data: ({ json }) => json.dataset('absent'),
  task: () => { throw new Error('must not execute task'); }, scorers: [scorers.exactMatch()] });`,
    });
    expect(result.status, result.logs).toBe(1);
    expect(result.report).toMatchObject({ numFailedEvals: 1 });
    expect(result.report.evalResults[0].message).toContain(
      'Dataset "absent" not found'
    );
    expect(result.logs).toContain('loads evaluation data');
    expect(result.logs).not.toContain('must not execute task');
  });

  it.each([
    ['concurrency', 'concurrency: 0', 'positive integer'],
    ['timeout', 'timeout: -1', 'timeout must be positive'],
    ['retries', 'retries: -1', 'non-negative integer'],
  ])(
    'should reject invalid %s before running tasks',
    async (_name, option, diagnostic) => {
      const result = await run({
        evaluation: `evaluate('invalid', { ${option}, data: [{ input: 1, expected: 1 }], task: () => 1, scorers: [scorers.exactMatch()] });`,
      });
      expect(result.status, result.logs).toBe(1);
      expect(result.report.evalResults[0].message).toContain(diagnostic);
    }
  );

  it('should suppress late task results after finalizing timeout diagnostics', async () => {
    const result = await run({
      evaluation: `import { afterAll } from 'vitest';
afterAll(async () => { await new Promise(resolve => setTimeout(resolve, 180)); });
evaluate('late task', { timeout: 30, data: [{ input: 'q', expected: 'a' }],
  task: async () => { await new Promise(resolve => setTimeout(resolve, 100)); return 'late'; },
  scorers: [scorers.exactMatch()] });`,
    });
    expect(result.status, result.logs).toBe(1);
    expect((await storedRuns(result.root))[0]).toMatchObject({
      status: 'failed',
      results: [
        {
          output: null,
          scores: [],
          metadata: { executionError: expect.stringContaining('timed out') },
        },
      ],
    });
  });

  it.each(['task rejection', 'scorer rejection', 'scorer resolution'])(
    'should ignore late %s without overwriting the timeout result',
    async (phase) => {
      const late = `async () => { await new Promise(resolve => setTimeout(resolve, 100)); ${phase.endsWith('rejection') ? "throw new Error('late rejection');" : 'return { score: 1 };'} }`;
      const result = await run({
        evaluation: `import { afterAll } from 'vitest';
afterAll(async () => { await new Promise(resolve => setTimeout(resolve, 180)); });
evaluate('late operation', { timeout: 30, data: [{ input: 'q', expected: 'a' }],
  task: ${phase === 'task rejection' ? late : "() => 'a'"},
  scorers: ${phase === 'task rejection' ? '[scorers.exactMatch()]' : `[${late}]`} });`,
      });
      expect(result.status, result.logs).toBe(1);
      expect((await storedRuns(result.root))[0]).toMatchObject({
        status: 'failed',
        results: [
          {
            output: null,
            scores: [],
            metadata: { executionError: expect.stringContaining('timed out') },
          },
        ],
      });
      expect(result.logs).not.toContain('Unhandled Rejection');
    }
  );

  it('should capture non-Error task failures and fallback scorer names', async () => {
    const result = await run({
      evaluation: `evaluate('string failure', { data: [{ input: 1, expected: 1 }], task: () => { throw 'task rejected'; }, scorers: [scorers.exactMatch()] });
function unnamedScore() { return { name: '', score: null }; }
evaluate('fallback score', { data: [{ input: 2, expected: 2 }], task: ({ input }) => input, threshold: 0, scorers: [unnamedScore] });`,
    });
    expect(result.status, result.logs).toBe(1);
    const runs = await storedRuns(result.root);
    expect(runs.find((item) => item.name === 'string failure')).toMatchObject({
      results: [{ metadata: { executionError: 'task rejected' } }],
    });
    expect(runs.find((item) => item.name === 'fallback score')).toMatchObject({
      status: 'completed',
      results: [{ scores: [{ name: 'unnamedScore', score: 0 }] }],
    });
  });

  it('should report null dataset results instead of collecting an empty suite', async () => {
    const result = await run({
      evaluation: `const data = { name: 'missing', load: async () => ({ ok: true, value: null }) };
evaluate('null dataset', { data, task: () => 'a', scorers: [scorers.exactMatch()] });`,
    });
    expect(result.status, result.logs).toBe(1);
    expect(result.report).toMatchObject({ numFailedEvals: 1 });
    expect(result.report.evalResults[0].message).toContain(
      'Dataset returned no data'
    );
  });

  it('should load arrays from references and Results from dataset declarations', async () => {
    const result = await run({
      evaluation: `import { defineDataset } from 'viteval';
const items = [{ input: 'a', expected: 'a' }];
evaluate('reference', { data: { name: 'reference', load: async () => items }, task: ({ input }) => input, scorers: [scorers.exactMatch()] });
evaluate('declaration', { data: defineDataset({ name: 'declared', data: items, providers: [] }), task: ({ input }) => input, scorers: [scorers.exactMatch()] });`,
    });
    expect(result.status, result.logs).toBe(0);
    expect(result.report).toMatchObject({ numPassedEvals: 2 });
  });

  it('should turn failed dataset Results into an explicit loading test', async () => {
    const result = await run({
      evaluation: `import { defineDataset } from 'viteval';
evaluate('failed declaration', {
   data: defineDataset({ name: 'broken', providers: [], data: async () => { throw new Error('dataset generation rejected'); } }),
  task: () => 'a', scorers: [scorers.exactMatch()]
});`,
    });
    expect(result.status, result.logs).toBe(1);
    expect(result.report).toMatchObject({ numFailedEvals: 1 });
    expect(result.report.evalResults[0].message).toContain(
      'dataset generation rejected'
    );
    expect(result.logs).toContain('loads evaluation data');
  });
});

async function run(options: { evaluation: string; config?: string }) {
  const root = path.join(ROOT, String(sequence++));
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
  await writeFile(
    path.join(root, 'viteval.config.ts'),
    `import { defineConfig, createProvider, createJsonProvider } from 'viteval';
const json = createJsonProvider({ root: import.meta.dirname });
${options.config ?? "export default defineConfig({ providers: [json], eval: { results: ['json'] } });"}`
  );
  const coverage = createCoverageArguments();
  const blob = coverage
    .find((argument) => argument.startsWith('--outputFile.blob='))
    ?.slice('--outputFile.blob='.length);
  await writeFile(
    path.join(root, 'engine.config.ts'),
    `import config from './viteval.config.ts';
import { createRunnerConfig } from '@viteval/core/internal/runner';
import { createJsonReporter } from '@viteval/core/internal/reporter';
export default { ...config, plugins: createRunnerConfig({ root: ${JSON.stringify(root)}, configFile: ${JSON.stringify(path.join(root, 'viteval.config.ts'))} }).plugins, test: { reporters: ['default', ${blob ? `['blob', { outputFile: ${JSON.stringify(blob)} }],` : ''} createJsonReporter({ outputFile: 'report.json' })] } };`
  );
  const evaluator = coverage.length
    ? path.resolve(import.meta.dirname, '../core/src/evaluate/evaluate.ts')
    : 'viteval';
  await writeFile(
    path.join(root, 'regression.eval.ts'),
    `import { evaluate } from ${JSON.stringify(evaluator)};
import { scorers } from 'viteval';
${options.evaluation}`
  );
  const args = [
    ENGINE,
    'run',
    '--config',
    path.join(root, 'engine.config.ts'),
    '--root',
    root,
    ...coverage.filter(
      (argument) =>
        !argument.startsWith('--reporter=') &&
        !argument.startsWith('--outputFile.')
    ),
  ];
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, CI: 'true', NO_COLOR: '1' },
    timeout: 30_000,
  });
  const logs = `${result.stdout}${result.stderr}`;
  const report = EVAL_RESULTS_SCHEMA.parse(
    JSON.parse(
      await readFile(path.join(root, 'report.json'), 'utf8').catch(
        (error: unknown) => {
          throw new Error(`Evaluation did not write a report: ${logs}`, {
            cause: error,
          });
        }
      )
    )
  );
  return { root, status: result.status, logs, report };
}

async function storedRuns(root: string) {
  const provider = createJsonProvider({ root });
  const runs = await provider.evals!.list();
  if (!runs.ok) throw runs.error;
  return runs.value;
}
