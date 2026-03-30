import fs from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EvalResult } from '#/types';
import type { TestCase, TestModule, Vitest } from 'vitest/node';
import JsonReporter from './json';

vi.mock('node:fs', () => ({
	default: {
		existsSync: vi.fn(),
		mkdirSync: vi.fn(),
		writeFileSync: vi.fn(),
	},
}));

function createMockEvalResult(overrides: Partial<EvalResult> = {}): EvalResult {
	return {
		aggregation: 'mean',
		expected: 'expected output',
		input: 'test input',
		mean: 0.85,
		median: 0.9,
		name: 'test-eval',
		output: 'actual output',
		scores: [
			{ name: 'accuracy', score: 0.85 },
		],
		sum: 0.85,
		threshold: 0.7,
		...overrides,
	};
}

function createMockTestCase(options: {
	evalResult?: EvalResult | null;
	state?: 'passed' | 'failed';
	errors?: Array<{ message: string }>;
	startTime?: number;
	duration?: number;
	parentType?: 'suite' | 'module';
	parentName?: string;
	moduleId?: string;
}): TestCase {
	const {
		evalResult = null,
		state = 'passed',
		errors = [],
		startTime = 1000,
		duration = 500,
		parentType = 'suite',
		parentName = 'my eval suite',
		moduleId = '/path/to/test.ts',
	} = options;

	return {
		diagnostic: () => ({ duration, startTime }),
		meta: () => ({ evalResult }),
		module: { moduleId },
		parent: { name: parentName, type: parentType },
		result: () => ({ errors, state }),
	} as unknown as TestCase;
}

describe('JsonReporter', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
	});

	describe('constructor', () => {
		it('should initialize with default values', () => {
			const reporter = new JsonReporter();
			expect(reporter).toBeDefined();
		});

		it('should accept an outputFile option', () => {
			const reporter = new JsonReporter({ outputFile: 'results.json' });
			expect(reporter).toBeDefined();
		});
	});

	describe('onInit', () => {
		it('should set status to running and write initial results', () => {
			const reporter = new JsonReporter({ outputFile: 'results.json' });
			vi.mocked(fs.existsSync).mockReturnValue(true);

			reporter.onInit({} as Vitest);

			expect(fs.writeFileSync).toHaveBeenCalledOnce();
			const writtenJson = JSON.parse(
				vi.mocked(fs.writeFileSync).mock.calls[0][1] as string,
			);
			expect(writtenJson.status).toBe('running');
		});
	});

	describe('onTestCaseResult', () => {
		it('should accumulate eval results from test case meta', () => {
			const reporter = new JsonReporter({ outputFile: 'results.json' });
			const evalResult = createMockEvalResult();
			const testCase = createMockTestCase({ evalResult });

			reporter.onTestCaseResult(testCase);

			// Finalize to inspect results
			vi.mocked(fs.existsSync).mockReturnValue(true);
			reporter.onTestRunEnd([], [], 'passed');

			const writtenJson = JSON.parse(
				vi.mocked(fs.writeFileSync).mock.calls[0][1] as string,
			);
			expect(writtenJson.numTotalEvals).toBe(1);
			expect(writtenJson.evalResults[0].evalResults).toHaveLength(1);
			expect(writtenJson.evalResults[0].evalResults[0].name).toBe('test-eval');
		});

		it('should skip test cases without evalResult in meta', () => {
			const reporter = new JsonReporter({ outputFile: 'results.json' });
			const testCase = createMockTestCase({ evalResult: undefined });

			reporter.onTestCaseResult(testCase);

			vi.mocked(fs.existsSync).mockReturnValue(true);
			reporter.onTestRunEnd([], [], 'passed');

			const writtenJson = JSON.parse(
				vi.mocked(fs.writeFileSync).mock.calls[0][1] as string,
			);
			expect(writtenJson.numTotalEvals).toBe(0);
			expect(writtenJson.evalResults).toHaveLength(0);
		});

		it('should track failed tests and error messages', () => {
			const reporter = new JsonReporter({ outputFile: 'results.json' });
			const evalResult = createMockEvalResult();
			const testCase = createMockTestCase({
				errors: [{ message: 'Threshold not met' }],
				evalResult,
				state: 'failed',
			});

			reporter.onTestCaseResult(testCase);

			vi.mocked(fs.existsSync).mockReturnValue(true);
			reporter.onTestRunEnd([], [], 'passed');

			const writtenJson = JSON.parse(
				vi.mocked(fs.writeFileSync).mock.calls[0][1] as string,
			);
			expect(writtenJson.evalResults[0].status).toBe('failed');
			expect(writtenJson.evalResults[0].message).toBe('Threshold not met');
		});
	});

	describe('onTestModuleEnd', () => {
		it('should trigger writeResults', () => {
			const reporter = new JsonReporter({ outputFile: 'results.json' });
			vi.mocked(fs.existsSync).mockReturnValue(true);

			reporter.onTestModuleEnd({} as TestModule);

			expect(fs.writeFileSync).toHaveBeenCalledOnce();
		});
	});

	describe('onTestRunEnd', () => {
		it('should finalize results with status finished', () => {
			const reporter = new JsonReporter({ outputFile: 'results.json' });
			vi.mocked(fs.existsSync).mockReturnValue(true);

			reporter.onTestRunEnd([], [], 'passed');

			const writtenJson = JSON.parse(
				vi.mocked(fs.writeFileSync).mock.calls[0][1] as string,
			);
			expect(writtenJson.status).toBe('finished');
			expect(writtenJson.endTime).toBeDefined();
			expect(writtenJson.duration).toBeDefined();
		});

		it('should calculate pass/fail counts correctly', () => {
			const reporter = new JsonReporter({ outputFile: 'results.json' });
			vi.mocked(fs.existsSync).mockReturnValue(true);

			const passingResult = createMockEvalResult({ mean: 0.9, threshold: 0.7 });
			const failingResult = createMockEvalResult({ mean: 0.3, threshold: 0.7 });

			reporter.onTestCaseResult(
				createMockTestCase({
					evalResult: passingResult,
					moduleId: '/test1.ts',
					parentName: 'suite-a',
				}),
			);
			reporter.onTestCaseResult(
				createMockTestCase({
					evalResult: failingResult,
					moduleId: '/test2.ts',
					parentName: 'suite-b',
				}),
			);

			reporter.onTestRunEnd([], [], 'passed');

			const writtenJson = JSON.parse(
				vi.mocked(fs.writeFileSync).mock.calls[0][1] as string,
			);
			expect(writtenJson.numTotalEvalSuites).toBe(2);
			expect(writtenJson.numPassedEvalSuites).toBe(1);
			expect(writtenJson.numFailedEvalSuites).toBe(1);
			expect(writtenJson.numTotalEvals).toBe(2);
			expect(writtenJson.numPassedEvals).toBe(1);
			expect(writtenJson.numFailedEvals).toBe(1);
			expect(writtenJson.success).toBe(false);
		});

		it('should set success to true when all suites pass', () => {
			const reporter = new JsonReporter({ outputFile: 'results.json' });
			vi.mocked(fs.existsSync).mockReturnValue(true);

			const passingResult = createMockEvalResult({ mean: 0.9, threshold: 0.7 });
			reporter.onTestCaseResult(
				createMockTestCase({ evalResult: passingResult }),
			);

			reporter.onTestRunEnd([], [], 'passed');

			const writtenJson = JSON.parse(
				vi.mocked(fs.writeFileSync).mock.calls[0][1] as string,
			);
			expect(writtenJson.success).toBe(true);
		});
	});

	describe('suite summary calculation', () => {
		it('should calculate mean, median, and sum scores', () => {
			const reporter = new JsonReporter({ outputFile: 'results.json' });
			vi.mocked(fs.existsSync).mockReturnValue(true);

			const result1 = createMockEvalResult({ mean: 0.8, median: 0.7, sum: 2.4 });
			const result2 = createMockEvalResult({ mean: 0.6, median: 0.5, sum: 1.8 });

			reporter.onTestCaseResult(
				createMockTestCase({
					evalResult: result1,
					moduleId: '/test.ts',
					parentName: 'suite',
				}),
			);
			reporter.onTestCaseResult(
				createMockTestCase({
					evalResult: result2,
					moduleId: '/test.ts',
					parentName: 'suite',
				}),
			);

			reporter.onTestRunEnd([], [], 'passed');

			const writtenJson = JSON.parse(
				vi.mocked(fs.writeFileSync).mock.calls[0][1] as string,
			);
			const summary = writtenJson.evalResults[0].summary;
			expect(summary.meanScore).toBeCloseTo(0.7);
			expect(summary.medianScore).toBeCloseTo(0.6);
			expect(summary.sumScore).toBeCloseTo(4.2);
			expect(summary.totalCount).toBe(2);
		});
	});

	describe('output file writing', () => {
		it('should create directory if it does not exist', () => {
			const reporter = new JsonReporter({ outputFile: '/output/dir/results.json' });
			vi.mocked(fs.existsSync).mockReturnValue(false);

			reporter.onInit({} as Vitest);

			expect(fs.mkdirSync).toHaveBeenCalledWith(
				expect.stringContaining('output'),
				{ recursive: true },
			);
		});

		it('should write JSON to the output file', () => {
			const reporter = new JsonReporter({ outputFile: 'results.json' });
			vi.mocked(fs.existsSync).mockReturnValue(true);

			reporter.onInit({} as Vitest);

			expect(fs.writeFileSync).toHaveBeenCalledOnce();
			const written = vi.mocked(fs.writeFileSync).mock.calls[0][1] as string;
			expect(() => JSON.parse(written)).not.toThrow();
		});

		it('should write to stdout when no outputFile is provided', () => {
			const reporter = new JsonReporter();
			const stdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

			reporter.onInit({} as Vitest);

			expect(stdoutWrite).toHaveBeenCalled();
			expect(fs.writeFileSync).not.toHaveBeenCalled();
		});
	});
});
