import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EVAL_RESULT_ARTIFACT_TYPE } from '#/evaluate/artifact';
import { createJsonProvider } from '#/provider/json';
import type { EvalResult } from '#/types';
import type { TestCase, TestModule, Vitest } from 'vitest/node';
import JsonReporter, { type JsonReporterOptions } from './json';
import { EVAL_RESULTS_SCHEMA } from './schema';

let root: string;

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'viteval-json-reporter-'));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(root, { force: true, recursive: true });
});

describe('JsonReporter', () => {
  it('should retain each suite end time instead of extending it to reporter projection time', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(10_000);
    const reporter = createReporter();
    await reporter.onTestRunEnd(
      [createMockModule([{ state: 'passed' }, { state: 'passed' }])],
      [],
      'passed'
    );
    expect((await readResults()).evalResults[0]).toMatchObject({
      startTime: 1_000,
      endTime: 1_020,
      duration: 20,
    });
  });

  it('projects final Vitest task states and evaluation artifacts', async () => {
    const reporter = createReporter();
    const testModule = createMockModule([
      { evalResult: createEvalResult(), state: 'passed' },
      {
        errors: [{ message: 'Task failed' }],
        state: 'failed',
      },
      { state: 'skipped' },
    ]);

    await reporter.onTestRunEnd([testModule], [], 'failed');

    const results = await readResults();
    expect(results).toMatchObject({
      numFailedEvalSuites: 1,
      numFailedEvals: 1,
      numPassedEvals: 1,
      numSkippedEvals: 1,
      numTotalEvalSuites: 1,
      numTotalEvals: 3,
      status: 'finished',
      success: false,
    });
    expect(results.evalResults[0].evalResults).toHaveLength(1);
    expect(results.evalResults[0].message).toBe('Task failed');
  });

  it('uses Vitest state instead of recalculating thresholds', async () => {
    const reporter = createReporter();
    const testModule = createMockModule([
      {
        evalResult: createEvalResult({ mean: 0.1, threshold: 0.9 }),
        state: 'passed',
      },
    ]);

    await reporter.onTestRunEnd([testModule], [], 'passed');

    const results = await readResults();
    expect(results.success).toBe(true);
    expect(results.evalResults[0].status).toBe('passed');
    expect(results.numPassedEvals).toBe(1);
  });

  it('excludes native Vitest tests without evaluation metadata', async () => {
    const reporter = createReporter();
    const testModule = createMockModule([
      { isViteval: false, state: 'passed' },
      { evalResult: createEvalResult(), state: 'passed' },
    ]);

    await reporter.onTestRunEnd([testModule], [], 'passed');

    const results = await readResults();
    expect(results.numTotalEvals).toBe(1);
    expect(results.numPassedEvals).toBe(1);
  });

  it('excludes native tests from counts but respects the failed run outcome', async () => {
    const reporter = createReporter();
    const evalModule = createMockModule([
      { evalResult: createEvalResult(), state: 'passed' },
    ]);
    const nativeModule = createMockModule(
      [{ isViteval: false, state: 'failed' }],
      [{ message: 'Native test failed' }],
      'example.test.ts'
    );

    await reporter.onTestRunEnd([evalModule, nativeModule], [], 'failed');

    const results = await readResults();
    expect(results.numTotalEvalSuites).toBe(1);
    expect(results.success).toBe(false);
  });

  it('keeps same-file collection errors separate across projects', async () => {
    const reporter = createReporter();
    const first = createMockModule([], [{ message: 'First setup failed' }]);
    const second = createMockModule([], [{ message: 'Second setup failed' }]);
    Object.assign(first, { project: { name: 'first' } });
    Object.assign(second, { project: { name: 'second' } });

    await reporter.onTestRunEnd([first, second], [], 'failed');

    const results = await readResults();
    expect(results.numFailedEvalSuites).toBe(2);
    expect(results.evalResults).toMatchObject([
      { projectName: 'first', message: 'First setup failed' },
      { projectName: 'second', message: 'Second setup failed' },
    ]);
  });

  it('does not attach a project collection failure to another project suite', async () => {
    const reporter = createReporter();
    const first = createMockModule([
      { evalResult: createEvalResult(), state: 'passed' },
    ]);
    const second = createMockModule([], [{ message: 'Second setup failed' }]);
    Object.assign(first, { project: { name: 'first' } });
    Object.assign(second, { project: { name: 'second' } });

    await reporter.onTestRunEnd([first, second], [], 'failed');

    expect((await readResults()).evalResults).toMatchObject([
      { projectName: 'first', status: 'passed' },
      {
        projectName: 'second',
        status: 'failed',
        message: 'Second setup failed',
      },
    ]);
  });

  it('retains module setup failures without artifacts', async () => {
    const reporter = createReporter();
    const testModule = createMockModule([], [{ message: 'Setup failed' }]);

    await reporter.onTestRunEnd([testModule], [], 'failed');

    const results = await readResults();
    expect(results.numFailedEvalSuites).toBe(1);
    expect(results.evalResults[0].message).toBe('Setup failed');
    expect(results.success).toBe(false);
  });

  it('marks passed tasks unsuccessful when Vitest reports a run error', async () => {
    const reporter = createReporter();
    const testModule = createMockModule([{ state: 'passed' }]);

    await reporter.onTestRunEnd(
      [testModule],
      [{ message: 'Unhandled rejection' } as never],
      'passed'
    );

    expect((await readResults()).success).toBe(false);
  });

  it('calculates evaluation-domain score summaries', async () => {
    const reporter = createReporter();
    const testModule = createMockModule([
      {
        evalResult: createEvalResult({ mean: 0.8, median: 0.7, sum: 2.4 }),
        state: 'passed',
      },
      {
        evalResult: createEvalResult({ mean: 0.6, median: 0.5, sum: 1.8 }),
        state: 'passed',
      },
    ]);

    await reporter.onTestRunEnd([testModule], [], 'passed');

    expect((await readResults()).evalResults[0].summary).toMatchObject({
      meanScore: 0.7,
      medianScore: 0.6,
      passedCount: 2,
      sumScore: 4.2,
      totalCount: 2,
    });
  });

  it('resets run-local results for watch reruns', async () => {
    const reporter = createReporter();
    await reporter.onTestRunEnd(
      [createMockModule([{ state: 'failed' }])],
      [],
      'failed'
    );

    reporter.onTestRunStart();
    await reporter.onTestRunEnd(
      [createMockModule([{ state: 'passed' }])],
      [],
      'passed'
    );

    const results = await readResults();
    expect(results.numTotalEvals).toBe(1);
    expect(results.numPassedEvals).toBe(1);
    expect(results.success).toBe(true);
  });

  it('should give watch reruns distinct identities and preserve history', async () => {
    const reporter = new JsonReporter({ outputFile: 'history/<id>.json' });
    reporter.onInit({ config: { root } } as Vitest);
    reporter.onTestRunStart();
    await reporter.onTestRunEnd(
      [createMockModule([{ evalResult: createEvalResult(), state: 'passed' }])],
      [],
      'passed'
    );
    reporter.onTestRunStart();
    await reporter.onTestRunEnd(
      [createMockModule([{ evalResult: createEvalResult(), state: 'passed' }])],
      [],
      'passed'
    );
    const files = await fs.readdir(path.join(root, 'history'));
    expect(files).toHaveLength(2);
    const reports = await Promise.all(
      files.map(async (file) =>
        JSON.parse(await fs.readFile(path.join(root, 'history', file), 'utf8'))
      )
    );
    expect(new Set(reports.map((report) => report.runId)).size).toBe(2);
  });

  it('should report interruption and calculate a true median', async () => {
    const reporter = createReporter();
    await reporter.onTestRunEnd(
      [
        createMockModule([
          { state: 'passed', evalResult: createEvalResult({ median: 0 }) },
          { state: 'passed', evalResult: createEvalResult({ median: 0 }) },
          { state: 'passed', evalResult: createEvalResult({ median: 1 }) },
        ]),
      ],
      [],
      'interrupted'
    );
    const results = await readResults();
    expect(results).toMatchObject({
      success: false,
      errors: ['Evaluation run interrupted'],
    });
    expect(results.evalResults[0].summary.medianScore).toBe(0);
  });

  it('writes JSON to stdout when no output file is configured', async () => {
    const write = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    const reporter = new JsonReporter();

    await reporter.onTestRunEnd([], [], 'passed');

    expect(JSON.parse(String(write.mock.calls[0][0]))).toMatchObject({
      status: 'finished',
      success: true,
      evalResults: [],
    });
  });

  it('should retain failed and skipped artifacts and leave pending tasks uncounted by outcome', async () => {
    const reporter = createReporter();
    await reporter.onTestRunEnd(
      [
        createMockModule([
          {
            state: 'failed',
            errors: [{ message: 'first error' }, { message: 'second error' }],
            evalResult: createEvalResult(),
          },
          {
            state: 'skipped',
            evalResult: createEvalResult({ mean: 1, median: 1, sum: 1 }),
          },
          { state: 'pending', noDiagnostic: true },
        ]),
      ],
      [],
      'interrupted'
    );
    const report = await readResults();
    expect(report).toMatchObject({
      numTotalEvals: 3,
      numFailedEvals: 1,
      numSkippedEvals: 1,
      numPassedEvals: 0,
    });
    expect(report.evalResults[0]).toMatchObject({
      evalResults: [
        { state: 'failed', error: 'first error\nsecond error' },
        { state: 'skipped' },
      ],
      summary: { meanScore: 0.85, sumScore: 0.85 },
    });
  });

  it('should project top-level evaluation tests using the module name', async () => {
    const reporter = createReporter();
    await reporter.onTestRunEnd(
      [
        createMockModule([
          {
            state: 'passed',
            moduleParent: true,
            evalResult: createEvalResult(),
          },
        ]),
      ],
      [],
      'passed'
    );
    expect((await readResults()).evalResults).toMatchObject([
      { name: 'example.eval.ts', status: 'passed' },
    ]);
  });

  it('should attach suite and module errors to an existing evaluation suite', async () => {
    const reporter = createReporter();
    await reporter.onTestRunEnd(
      [
        createMockModule(
          [
            {
              state: 'passed',
              suiteErrors: [{ message: 'suite hook failed' }],
              suiteFailed: true,
            },
          ],
          [{ message: 'module failed' }]
        ),
      ],
      [],
      'failed'
    );
    const report = await readResults();
    expect(report.numTotalEvalSuites).toBe(1);
    expect(report.evalResults).toMatchObject([
      { status: 'failed', message: 'suite hook failed\nmodule failed' },
    ]);
  });

  it('should produce V1 snapshots that the JSON provider reads without reconstructing outcomes', async () => {
    const reporter = createReporter({
      outputFile: '.viteval/results/snapshot.json',
      run: { id: 'current-run', name: 'current run' },
    });
    await reporter.onTestRunEnd(
      [
        createMockModule([
          {
            state: 'passed',
            evalResult: createEvalResult({
              mean: 0,
              median: 0,
              sum: 0,
              threshold: 1,
            }),
          },
        ]),
      ],
      [],
      'passed'
    );
    expect(
      await createJsonProvider({ root }).evals!.get({
        id: 'current-run',
        includeResults: true,
      })
    ).toMatchObject({
      ok: true,
      value: {
        id: 'current-run',
        status: 'completed',
        results: [{ passed: true, meanScore: 0 }],
      },
    });
  });
});

function createReporter(options: JsonReporterOptions = {}) {
  const reporter = new JsonReporter({ outputFile: 'results.json', ...options });
  reporter.onInit({ config: { root } } as Vitest);
  return reporter;
}

async function readResults() {
  return EVAL_RESULTS_SCHEMA.parse(
    JSON.parse(await fs.readFile(path.join(root, 'results.json'), 'utf8'))
  );
}

function createEvalResult(overrides: Partial<EvalResult> = {}): EvalResult {
  return {
    aggregation: 'mean',
    expected: 'expected output',
    input: 'test input',
    mean: 0.85,
    median: 0.9,
    name: 'test-eval',
    output: 'actual output',
    scores: [{ name: 'accuracy', score: 0.85 }],
    sum: 0.85,
    threshold: 0.7,
    ...overrides,
  };
}

interface MockTestOptions {
  errors?: { message: string }[];
  evalResult?: EvalResult;
  isViteval?: boolean;
  state: 'failed' | 'passed' | 'skipped' | 'pending';
  moduleParent?: boolean;
  noDiagnostic?: boolean;
  suiteErrors?: { message: string }[];
  suiteFailed?: boolean;
}

function createMockModule(
  testOptions: MockTestOptions[],
  moduleErrors: { message: string }[] = [],
  relativeModuleId = 'example.eval.ts'
): TestModule {
  const moduleId = path.join(root, relativeModuleId);
  const testModule = {
    type: 'module',
    diagnostic: () => ({ duration: 25 }),
    errors: () => moduleErrors,
    moduleId,
    ok: () =>
      moduleErrors.length === 0 && testCases.every((testCase) => testCase.ok()),
    relativeModuleId,
  } as unknown as TestModule;
  const testCases = testOptions.map((options, index) =>
    createMockTestCase(testModule, options, index)
  );
  Object.assign(testModule, {
    children: { allTests: () => testCases.values() },
  });
  return testModule;
}

function createMockTestCase(
  testModule: TestModule,
  options: MockTestOptions,
  index: number
): TestCase {
  const errors = options.errors ?? [];
  const parent = {
    errors: () => options.suiteErrors ?? [],
    id: 'suite',
    name: 'evaluation suite',
    ok: () => !options.suiteFailed && options.state !== 'failed',
    type: 'suite',
  };
  return {
    id: `${testModule.moduleId}:case-${index}`,
    artifacts: () =>
      options.evalResult
        ? [
            {
              result: options.evalResult,
              type: EVAL_RESULT_ARTIFACT_TYPE,
            },
          ]
        : [],
    diagnostic: () =>
      options.noDiagnostic
        ? undefined
        : { duration: 10, startTime: 1000 + index * 10 },
    module: testModule,
    meta: () => (options.isViteval === false ? {} : { viteval: true }),
    ok: () => options.state !== 'failed',
    parent: options.moduleParent ? testModule : parent,
    result: () => ({ errors, state: options.state }),
  } as unknown as TestCase;
}
