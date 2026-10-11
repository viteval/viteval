import { spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { EVAL_RESULTS_SCHEMA } from '@viteval/core/reporters';
import { createJsonProvider } from '@viteval/core/provider';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

const ROOT = path.join(import.meta.dirname, '.test-evaluation-contract');
const CLI = path.resolve(import.meta.dirname, '../cli/cli.mjs');
const BINARY = process.env.VITEVAL_TEST_BINARY;
let invocation = 0;
const CONFIG = `import { defineConfig } from 'vitest/config';
import { JsonReporter } from 'viteval/reporters';
export default defineConfig({ test: { include: ['contract.eval.ts'], reporters: [new JsonReporter({ outputFile: '.viteval/results/contract.json' })], setupFiles: ['./setup.ts'] } });`;

beforeAll(async () => {
  await mkdir(ROOT, { recursive: true });
  await writeFile(path.join(ROOT, 'vitest.config.ts'), CONFIG);
});
afterAll(async () => {
  await rm(ROOT, { force: true, recursive: true });
});

describe('evaluation contract', () => {
  it('should initialize the judge model in native worker setup', async () => {
    const result = await run(
      `import { scorers } from 'viteval';
evaluate('configured judge', { data: [{ name: 'named case', input: 'q', expected: 'a' }], task: () => 'a', scorers: [scorers.answerCorrectness()] });`,
      `import { initializeModel } from 'viteval';
initializeModel({
  specificationVersion: 'v4', provider: 'fixture', modelId: 'judge', supportedUrls: {},
  doGenerate: async () => ({
    content: [{ type: 'text', text: JSON.stringify({ choice: 'A', reasons: 'Correct answer.' }) }],
    finishReason: { unified: 'stop', raw: undefined },
    usage: { inputTokens: { total: 1, noCache: 1 }, outputTokens: { total: 1, text: 1 } },
    warnings: [],
  }),
});`
    );
    expect(result.exitCode, result.logs).toBe(0);
    expect(result.report.evalResults[0].evalResults[0]).toMatchObject({
      name: 'named case',
      state: 'passed',
      scores: [{ name: 'AnswerCorrectness', score: 1 }],
    });
  });

  it('should retain missing-model diagnostics from a judge scorer', async () => {
    const result = await run(`import { scorers } from 'viteval';
evaluate('unconfigured judge', { data: [{ input: 'q', expected: 'a' }], task: () => 'a', scorers: [scorers.answerCorrectness()] });`);
    expect(result.exitCode, result.logs).toBe(1);
    const item = result.report.evalResults[0].evalResults[0];
    expect(item.state).toBe('failed');
    expect(JSON.stringify(item.scores)).toContain('Model not initialized');
  });

  it('should preserve diagnostics for input that cannot be serialized', async () => {
    const result = await run(`const cyclic = {}; cyclic.self = cyclic;
evaluate('cyclic input', { data: [{ input: cyclic, expected: 'a' }], task: () => 'a', scorers: [score(1)] });`);
    expect(result.exitCode, result.logs).toBe(1);
    expect(result.report.evalResults[0].evalResults[0]).toMatchObject({
      state: 'failed',
      input: null,
      metadata: { executionError: expect.stringContaining('circular') },
    });
  });

  it('should fail the suite explicitly when the configured provider cannot persist a run', async () => {
    const providerRoot = path.join(ROOT, 'blocked-provider');
    await mkdir(path.join(providerRoot, '.viteval'), { recursive: true });
    await writeFile(
      path.join(providerRoot, '.viteval', 'results'),
      'blocking file'
    );
    const result = await run(
      `evaluate('persistence failure', { data: [{ input: 'q', expected: 'a' }], task: () => 'a', scorers: [score(1)] });`,
      `import { initializeProvider, createJsonProvider } from 'viteval/provider';
const initialized = await initializeProvider(createJsonProvider({ root: ${JSON.stringify(providerRoot)} }));
if (!initialized.ok) throw initialized.error;`
    );
    expect(result.exitCode, result.logs).toBe(1);
    expect(result.report).toMatchObject({
      success: false,
      numFailedEvalSuites: 1,
    });
    expect(result.report.evalResults[0].message).toMatch(/EEXIST|ENOTDIR/);
    expect(
      await readFile(path.join(providerRoot, '.viteval', 'results'), 'utf8')
    ).toBe('blocking file');
  });

  it('should create JSON datasets under the root configured by native setup', async () => {
    const result = await run(
      `import { defineDataset } from 'viteval/dataset';
const data = defineDataset({ name: 'rooted-eval', data: async () => [{ input: 'q', expected: 'a' }] });
evaluate('local data', { data, task: () => 'a', scorers: [score(1)] });`,
      `import { initializeProvider, createJsonProvider } from 'viteval/provider';
const initialized = await initializeProvider({ datasets: createJsonProvider({ root: ${JSON.stringify(ROOT)} }) });
if (!initialized.ok) throw initialized.error;`
    );
    expect(result.exitCode, result.logs).toBe(0);
    const saved = JSON.parse(
      await readFile(
        path.join(ROOT, '.viteval', 'datasets', 'rooted-eval.json'),
        'utf8'
      )
    );
    expect(saved.data).toEqual([{ input: 'q', expected: 'a' }]);
  });
  it('should retain actual median and sum outcomes in JSON', async () => {
    const result =
      await run(`evaluate('median', { data: [{ input: 'question', expected: 'answer' }], task: () => 'answer', aggregation: 'median', threshold: 0.8, scorers: [score(0), score(1), score(1)] });
evaluate('sum', { data: [{ input: 'question', expected: 'answer' }], task: () => 'answer', aggregation: 'sum', threshold: 1, scorers: [score(0.5), score(0.5)] });`);
    expect(result.exitCode, result.logs).toBe(0);
    expect(
      result.report.evalResults
        .flatMap((suite) => suite.evalResults)
        .map((item) => item.state)
    ).toEqual(['passed', 'passed']);
  });

  it.each([
    [
      'task exception',
      "task: () => { throw new Error('task exploded'); }, scorers: [score(1)]",
      'task exploded',
    ],
    [
      'scorer exception',
      "task: () => 'answer', scorers: [createScorer({ name: 'broken', score: () => { throw new Error('scorer exploded'); } })]",
      'scorer exploded',
    ],
    [
      'non-finite score',
      "task: () => 'answer', scorers: [score(Infinity)]",
      'non-finite',
    ],
    [
      'unsupported output',
      'task: () => 1n, scorers: [score(1)]',
      'Unsupported JSON',
    ],
    [
      'timeout',
      "task: async () => { await new Promise(resolve => setTimeout(resolve, 100)); return 'answer'; }, scorers: [score(1)], testOptions: { timeout: 10 }",
      'timed out',
    ],
  ])(
    'should record %s with case diagnostics',
    async (_name, configuration, message) => {
      const result = await run(
        `evaluate('failure', { data: [{ input: 'question', expected: 'answer' }], ${configuration} });`
      );
      expect(result.exitCode, result.logs).toBe(1);
      const item = result.report.evalResults[0].evalResults[0];
      expect(item).toMatchObject({
        state: 'failed',
        input: 'question',
        expected: 'answer',
      });
      expect(`${item.error} ${item.metadata?.executionError}`).toContain(
        message
      );
      expect(result.report.success).toBe(false);
    }
  );

  it.each([
    [
      'empty dataset',
      "data: [], task: () => 'answer', scorers: [score(1)]",
      'dataset is empty',
    ],
    [
      'empty scorers',
      "data: [{ input: 'q', expected: 'a' }], task: () => 'answer', scorers: []",
      'at least one scorer',
    ],
    [
      'invalid threshold',
      "data: [{ input: 'q', expected: 'a' }], task: () => 'answer', scorers: [score(1)], threshold: NaN",
      'threshold must be finite',
    ],
    [
      'generator failure',
      "data: async () => { throw new Error('dataset exploded'); }, task: () => 'answer', scorers: [score(1)]",
      'dataset exploded',
    ],
  ])('should fail explicitly for %s', async (_name, configuration, message) => {
    const result = await run(`evaluate('invalid', { ${configuration} });`);
    expect(result.exitCode, result.logs).toBe(1);
    expect(result.report).toMatchObject({ success: false, numFailedEvals: 1 });
    expect(result.report.evalResults[0].message).toContain(message);
  });

  it('should retain only the final retry outcome', async () => {
    const result = await run(`let attempts = 0;
evaluate('retry', { data: [{ input: 'q', expected: 'a' }], task: () => { if (attempts++ === 0) throw new Error('retry me'); return 'a'; }, scorers: [score(1)], testOptions: { retry: 1 } });`);
    expect(result.exitCode, result.logs).toBe(0);
    expect(result.report).toMatchObject({
      numPassedEvals: 1,
      numFailedEvals: 0,
      success: true,
    });
    expect(result.report.evalResults[0].evalResults[0]).toMatchObject({
      state: 'passed',
      mean: 1,
      output: 'a',
    });
  });

  it('should count skipped cases without invoking tasks', async () => {
    const result = await run(
      `evaluate('skipped', { data: [{ input: 'q', expected: 'a' }], task: () => { throw new Error('must not run'); }, scorers: [score(1)], testOptions: { skip: true } });`
    );
    expect(result.exitCode, result.logs).toBe(0);
    expect(result.report).toMatchObject({
      numSkippedEvals: 1,
      numFailedEvals: 0,
    });
  });

  it('should persist configured-provider results after scoring', async () => {
    const providerRoot = path.join(ROOT, 'provider');
    const setup = `import { initializeProvider, createJsonProvider } from 'viteval';
const initialized = await initializeProvider(createJsonProvider({ root: ${JSON.stringify(providerRoot)} }));
if (!initialized.ok) throw initialized.error;`;
    const result = await run(
      `evaluate('provider result', { data: [{ input: 'q', expected: 'a' }], task: () => 'a', scorers: [score(1)] });`,
      setup
    );
    expect(result.exitCode, result.logs).toBe(0);
    const stored = await createJsonProvider({
      root: providerRoot,
    }).evals!.list();
    expect(stored).toMatchObject({
      ok: true,
      value: [
        { status: 'completed', summary: { passed: true, totalCount: 1 } },
      ],
    });
  });

  it.each([
    [
      'beforeEach',
      `beforeEach(() => { throw new Error('beforeEach exploded'); });`,
      0,
      2,
      0,
    ],
    [
      'beforeAll',
      `beforeAll(() => { throw new Error('beforeAll exploded'); });`,
      0,
      0,
      2,
    ],
    [
      'afterEach',
      `afterEach(() => { throw new Error('afterEach exploded'); });`,
      0,
      2,
      0,
    ],
    [
      'afterAll',
      `afterAll(() => { throw new Error('afterAll exploded'); });`,
      2,
      0,
      0,
    ],
    [
      'cleanup',
      `beforeAll(() => () => { throw new Error('cleanup exploded'); });`,
      2,
      0,
      0,
    ],
  ])(
    'should finalize provider failures and diagnostics from %s',
    async (hook, hooks, passedCount, failedCount, skippedCount) => {
      const { result, stored, providerReport } = await runWithProvider(
        `evaluate('hook failure', { data: [{ input: 'one', expected: 'a' }, { input: 'two', expected: 'a' }], task: () => 'a', scorers: [score(1)] });`,
        `import { beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
${hooks}`
      );
      expect(result.exitCode, result.logs).toBe(1);
      expect(result.report).toMatchObject({
        success: false,
        numPassedEvals: passedCount,
        numFailedEvals: failedCount,
        numSkippedEvals: skippedCount,
        numTotalEvals: 2,
      });
      expect(stored).toMatchObject({
        status: 'failed',
        summary: { passed: false, passedCount, failedCount, totalCount: 2 },
      });
      expect(stored.results).toHaveLength(2);
      for (const item of stored.results ?? []) {
        expect(item.metadata.executionError).toContain(`${hook} exploded`);
        if (hook === 'beforeEach' || hook === 'beforeAll') {
          expect(item.output).toBeNull();
          expect(item.scores).toEqual([]);
          expect(item.passed).toBe(false);
        } else {
          expect(item.output).toBe('a');
          expect(item.meanScore).toBe(1);
        }
      }
      expect(providerReport).toMatchObject({
        success: false,
        numPassedEvals: result.report.numPassedEvals,
        numFailedEvals: result.report.numFailedEvals,
        numSkippedEvals: result.report.numSkippedEvals,
        numTotalEvals: result.report.numTotalEvals,
      });
      expect(providerReport.evalResults[0].message).toContain(
        `${hook} exploded`
      );
    }
  );

  it('should persist only successful final retry outcomes without stale errors', async () => {
    const { result, stored } = await runWithProvider(`let attempts = 0;
evaluate('provider retry', { data: [{ input: 'q', expected: 'a' }], task: () => { if (attempts++ === 0) throw new Error('retry me'); return 'a'; }, scorers: [score(1)], testOptions: { retry: 1 } });`);
    expect(result.exitCode, result.logs).toBe(0);
    expect(stored).toMatchObject({
      status: 'completed',
      summary: { passed: true, totalCount: 1, passedCount: 1, failedCount: 0 },
      results: [{ passed: true, output: 'a', meanScore: 1 }],
    });
    expect(stored.results?.[0].metadata.executionError).toBeUndefined();
  });

  it('should preserve native all-skipped behavior without creating a provider run', async () => {
    const providerRoot = path.join(ROOT, 'provider-static-skip');
    const result = await run(
      `evaluate('provider skipped', { data: [{ input: 'q', expected: 'a' }], task: () => { throw new Error('must not run'); }, scorers: [score(1)], testOptions: { skip: true } });`,
      `import { initializeProvider, createJsonProvider } from 'viteval/provider';
const initialized = await initializeProvider(createJsonProvider({ root: ${JSON.stringify(providerRoot)} }));
if (!initialized.ok) throw initialized.error;`
    );
    expect(result.exitCode, result.logs).toBe(0);
    expect(result.report).toMatchObject({
      numSkippedEvals: 1,
      numFailedEvals: 0,
      numPassedEvals: 0,
      numTotalEvals: 1,
    });
    expect(result.report.evalResults[0].evalResults).toEqual([]);
    expect(
      await createJsonProvider({ root: providerRoot }).evals!.list()
    ).toMatchObject({ ok: true, value: [] });
  });

  it('should persist threshold failures with their scored output and diagnostics', async () => {
    const { result, stored, providerReport } = await runWithProvider(
      `evaluate('provider threshold', { data: [{ input: 'q', expected: 'a' }], task: () => 'a', scorers: [score(0.25)], threshold: 0.8 });`
    );
    expect(result.exitCode, result.logs).toBe(1);
    expect(stored).toMatchObject({
      status: 'failed',
      summary: { passed: false, passedCount: 0, failedCount: 1, totalCount: 1 },
      results: [{ passed: false, output: 'a', meanScore: 0.25 }],
    });
    expect(stored.results?.[0].metadata.executionError).toContain(
      'below threshold'
    );
    expect(providerReport.evalResults[0].evalResults[0]).toMatchObject({
      state: 'failed',
      mean: 0.25,
      error: expect.stringContaining('below threshold'),
    });
  });

  it('should keep provider counts and scored means consistent with dynamic skips', async () => {
    const { result, stored, providerReport } =
      await runWithProvider(`import { beforeEach } from 'vitest';
beforeEach(({ task, skip }) => { if (task.name === 'skip') skip('not applicable'); });
evaluate('mixed skip', { data: [{ name: 'skip', input: 'q', expected: 'a' }, { name: 'run', input: 'q', expected: 'a' }], task: () => 'a', scorers: [score(1)] });`);
    expect(result.exitCode, result.logs).toBe(0);
    expect(stored.summary).toMatchObject({
      passed: true,
      passedCount: 1,
      failedCount: 0,
      totalCount: 2,
      meanScore: 1,
    });
    expect(result.report.evalResults[0].summary.meanScore).toBe(1);
    expect(providerReport).toMatchObject({
      numPassedEvals: 1,
      numFailedEvals: 0,
      numSkippedEvals: 1,
      numTotalEvals: 2,
    });
  });

  it('should report the failed native run when a regular test fails alongside a passing evaluation', async () => {
    const result = await run(`import { test } from 'vitest';
test('regular failure', () => { throw new Error('regular test exploded'); });
evaluate('passing eval', { data: [{ input: 'q', expected: 'a' }], task: () => 'a', scorers: [score(1)] });`);
    expect(result.exitCode, result.logs).toBe(1);
    expect(result.report).toMatchObject({
      success: false,
      numPassedEvals: 1,
      numFailedEvals: 0,
      numTotalEvals: 1,
    });
  });

  it('should keep same-file module failures separate across native projects', async () => {
    const configuration = `import { defineConfig } from 'vitest/config';
import { JsonReporter } from 'viteval/reporters';
export default defineConfig({ test: { reporters: [new JsonReporter({ outputFile: '.viteval/results/contract.json' })], projects: [
{ test: { name: 'first', include: ['contract.eval.ts'] } }, { test: { name: 'second', include: ['contract.eval.ts'] } }
] } });`;
    const result = await run(
      `throw new Error('collection exploded');`,
      '',
      configuration
    );
    expect(result.exitCode, result.logs).toBe(1);
    expect(result.report).toMatchObject({
      success: false,
      numFailedEvalSuites: 2,
      numTotalEvalSuites: 2,
    });
    expect(
      result.report.evalResults.map((suite) => suite.projectName).toSorted()
    ).toEqual(['first', 'second']);
    expect(
      result.report.evalResults.every((suite) =>
        suite.message?.includes('collection exploded')
      )
    ).toBe(true);
  });

  it('should preserve case outputs during concurrent execution', async () => {
    const result = await run(`evaluate('concurrent', {
data: [{ input: 1, expected: 1 }, { input: 2, expected: 2 }, { input: 3, expected: 3 }],
task: async ({ input }) => { await new Promise(resolve => setTimeout(resolve, 20 * (4 - input))); return input; },
scorers: [createScorer({ name: 'exact', score: ({ output, expected }) => ({ score: output === expected ? 1 : 0 }) })], testOptions: { concurrent: true } });`);
    expect(result.exitCode, result.logs).toBe(0);
    expect(result.report.numPassedEvals).toBe(3);
    expect(
      result.report.evalResults[0].evalResults.every(
        (item) => item.output === item.input
      )
    ).toBe(true);
  });

  it('should treat null scores as zero', async () => {
    const result = await run(
      `evaluate('null score', { data: [{ input: 'q', expected: 'a' }], task: () => 'a', scorers: [score(null)], threshold: 0 });`
    );
    expect(result.exitCode, result.logs).toBe(0);
    expect(result.report.evalResults[0].evalResults[0]).toMatchObject({
      mean: 0,
      scores: [{ score: 0 }],
    });
  });

  it('should keep same-file suites distinct across Vitest projects', async () => {
    const configuration = `import { defineConfig } from 'vitest/config';
import { JsonReporter } from 'viteval/reporters';
export default defineConfig({ test: { reporters: [new JsonReporter({ outputFile: '.viteval/results/contract.json' })], projects: [
{ test: { name: 'first', include: ['contract.eval.ts'] } }, { test: { name: 'second', include: ['contract.eval.ts'] } }
] } });`;
    const result = await run(
      `evaluate('shared', { data: [{ input: 'q', expected: 'a' }], task: () => 'a', scorers: [score(1)] });`,
      '',
      configuration
    );
    expect(result.exitCode, result.logs).toBe(0);
    expect(result.report).toMatchObject({
      numTotalEvalSuites: 2,
      numPassedEvals: 2,
    });
    const runs = await createJsonProvider({ root: ROOT }).evals!.get({
      id: result.report.runId,
      includeResults: true,
    });
    expect(runs).toMatchObject({
      ok: true,
      value: { results: [{ passed: true }, { passed: true }] },
    });
  });
});

async function run(body: string, setup = '', configuration = CONFIG) {
  if (inject('integrationCoverage')) {
    const id = ++invocation;
    const coverage = {
      enabled: true,
      provider: 'v8',
      allowExternal: true,
      include: [
        path.resolve(import.meta.dirname, '../core/dist/**/*.mjs'),
        path.resolve(import.meta.dirname, '../core/src/**/*.ts'),
      ],
      exclude: ['**/node_modules/**', '**/*.test.*'],
      excludeAfterRemap: true,
      reportOnFailure: true,
      reportsDirectory: path.join(
        import.meta.dirname,
        'coverage',
        'integration-runs',
        String(id)
      ),
      reporter: ['json'],
    };
    const blob = [
      'blob',
      {
        outputFile: path.join(
          import.meta.dirname,
          'coverage',
          'integration-blobs',
          `${id}.json`
        ),
      },
    ];
    configuration = configuration.replace(
      /reporters:\s*\[/,
      `coverage: ${JSON.stringify(coverage)}, reporters: [${JSON.stringify(blob)}, `
    );
  }
  await writeFile(path.join(ROOT, 'vitest.config.ts'), configuration);
  await writeFile(path.join(ROOT, 'setup.ts'), setup);
  await writeFile(
    path.join(ROOT, 'contract.eval.ts'),
    `import { evaluate, createScorer } from 'viteval';
const score = (value) => createScorer({ name: 'score-' + value, score: () => ({ score: value }) });
${body}`
  );
  await rm(path.join(ROOT, '.viteval', 'results', 'contract.json'), {
    force: true,
  });
  const args = ['run', '--root', ROOT];
  const result = spawnSync(
    BINARY ?? process.execPath,
    BINARY ? args : [CLI, ...args],
    { encoding: 'utf8', timeout: 30_000 }
  );
  const report = EVAL_RESULTS_SCHEMA.parse(
    JSON.parse(
      await readFile(
        path.join(ROOT, '.viteval', 'results', 'contract.json'),
        'utf8'
      ).catch((error: unknown) => {
        throw new Error(
          `Native evaluation did not write a report (exit ${result.status}):\n${result.stdout}${result.stderr}`,
          { cause: error }
        );
      })
    )
  );
  return {
    exitCode: result.status,
    logs: `${result.stdout}${result.stderr}\n${JSON.stringify(report)}`,
    report,
  };
}

async function runWithProvider(body: string, hooks = '') {
  const providerRoot = path.join(ROOT, `provider-hooks-${++invocation}`);
  const result = await run(
    body,
    `import { initializeProvider, createJsonProvider } from 'viteval/provider';
const initialized = await initializeProvider(createJsonProvider({ root: ${JSON.stringify(providerRoot)} }));
if (!initialized.ok) throw initialized.error;
${hooks}`
  );
  const runs = await createJsonProvider({ root: providerRoot }).evals!.list();
  if (!runs.ok) throw runs.error;
  expect(runs.value).toHaveLength(1);
  const stored = runs.value[0];
  const providerReport = EVAL_RESULTS_SCHEMA.parse(
    JSON.parse(
      await readFile(
        path.join(providerRoot, '.viteval', 'results', `${stored.id}.json`),
        'utf8'
      )
    )
  );
  return { result, stored, providerReport };
}
