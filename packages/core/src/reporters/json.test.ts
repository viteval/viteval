import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { EvalResult } from '#/types';
import JsonReporter from './json';

vi.mock('node:fs');
vi.mock('node:path');

describe('JsonReporter', () => {
  let reporter: JsonReporter;
  let mockWriteFileSync: Mock;
  let mockExistsSync: Mock;
  let mockMkdirSync: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup fs mocks
    mockWriteFileSync = vi.mocked(fs.writeFileSync);
    mockExistsSync = vi.mocked(fs.existsSync);
    mockMkdirSync = vi.mocked(fs.mkdirSync);

    // Setup path mocks
    vi.mocked(path.resolve).mockImplementation((p) => `/absolute/${p}`);
    vi.mocked(path.dirname).mockImplementation(() => '/absolute');
    vi.mocked(path.relative).mockImplementation((_, p) => p);

    // Default mock implementations
    mockExistsSync.mockReturnValue(true);
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      reporter = new JsonReporter();
      expect(reporter).toBeDefined();
    });

    it('should accept output file option', () => {
      reporter = new JsonReporter({ outputFile: 'test-results.json' });
      expect(reporter).toBeDefined();
    });
  });

  describe('onInit', () => {
    it('should set initial status and write results', () => {
      const startTime = Date.now();
      reporter = new JsonReporter({ outputFile: 'test-results.json' });

      reporter.onInit();

      expect(mockWriteFileSync).toHaveBeenCalled();
      const writtenData = JSON.parse(mockWriteFileSync.mock.calls[0][1]);
      expect(writtenData.status).toBe('running');
      expect(writtenData.startTime).toBeGreaterThanOrEqual(startTime);
    });
  });

  describe('onFinished', () => {
    beforeEach(() => {
      reporter = new JsonReporter({ outputFile: 'test-results.json' });
      reporter.onInit();
      vi.clearAllMocks();
    });

    it('should process test suites and write final results', () => {
      const mockEvalResults: EvalResult[] = [
        {
          name: 'test-eval-1',
          mean: 0.8,
          median: 0.85,
          sum: 4.0,
          threshold: 0.7,
          aggregation: 'mean',
          scores: [0.8, 0.85, 0.75, 0.8],
        },
      ];

      const mockFile = {
        filepath: '/test/suite.ts',
        name: 'Test Suite',
        result: {
          startTime: Date.now() - 1000,
          endTime: Date.now(),
          state: 'pass',
        },
        tasks: [
          {
            name: 'Test Suite',
            meta: {
              results: mockEvalResults,
            },
          },
        ],
      };

      reporter.onFinished([mockFile]);

      expect(mockWriteFileSync).toHaveBeenCalled();
      const writtenData = JSON.parse(mockWriteFileSync.mock.calls[0][1]);

      expect(writtenData.status).toBe('finished');
      expect(writtenData.numTotalEvalSuites).toBe(1);
      expect(writtenData.numTotalEvals).toBe(1);
      expect(writtenData.numPassedEvals).toBe(1);
      expect(writtenData.numFailedEvals).toBe(0);
      expect(writtenData.success).toBe(true);
      expect(writtenData.evalResults).toHaveLength(1);
      expect(writtenData.evalResults[0].name).toBe('Test Suite');
      expect(writtenData.evalResults[0].status).toBe('passed');
    });

    it('should handle failed evaluations', () => {
      const mockEvalResults: EvalResult[] = [
        {
          name: 'test-eval-1',
          mean: 0.5,
          median: 0.5,
          sum: 2.0,
          threshold: 0.7,
          aggregation: 'mean',
          scores: [0.5, 0.5, 0.5, 0.5],
        },
      ];

      const mockFile = {
        filepath: '/test/suite.ts',
        name: 'Test Suite',
        result: {
          startTime: Date.now() - 1000,
          endTime: Date.now(),
          state: 'fail',
        },
        tasks: [
          {
            name: 'Test Suite',
            meta: {
              results: mockEvalResults,
            },
          },
        ],
      };

      reporter.onFinished([mockFile]);

      const writtenData = JSON.parse(
        mockWriteFileSync.mock.calls[mockWriteFileSync.mock.calls.length - 1][1]
      );

      expect(writtenData.numFailedEvals).toBe(1);
      expect(writtenData.numPassedEvals).toBe(0);
      expect(writtenData.numFailedEvalSuites).toBe(1);
      expect(writtenData.success).toBe(false);
      expect(writtenData.evalResults[0].status).toBe('failed');
    });

    it('should handle multiple suites', () => {
      const mockEvalResults1: EvalResult[] = [
        {
          name: 'eval-1',
          mean: 0.8,
          median: 0.8,
          sum: 3.2,
          threshold: 0.7,
          aggregation: 'mean',
          scores: [0.8, 0.8, 0.8, 0.8],
        },
      ];

      const mockEvalResults2: EvalResult[] = [
        {
          name: 'eval-2',
          mean: 0.9,
          median: 0.9,
          sum: 3.6,
          threshold: 0.8,
          aggregation: 'median',
          scores: [0.9, 0.9, 0.9, 0.9],
        },
      ];

      const mockFiles = [
        {
          filepath: '/test/suite1.ts',
          name: 'Suite 1',
          result: {
            startTime: Date.now() - 2000,
            endTime: Date.now() - 1000,
            state: 'pass',
          },
          tasks: [
            {
              name: 'Suite 1',
              meta: {
                results: mockEvalResults1,
              },
            },
          ],
        },
        {
          filepath: '/test/suite2.ts',
          name: 'Suite 2',
          result: {
            startTime: Date.now() - 1000,
            endTime: Date.now(),
            state: 'pass',
          },
          tasks: [
            {
              name: 'Suite 2',
              meta: {
                results: mockEvalResults2,
              },
            },
          ],
        },
      ];

      reporter.onFinished(mockFiles);

      const writtenData = JSON.parse(
        mockWriteFileSync.mock.calls[mockWriteFileSync.mock.calls.length - 1][1]
      );

      expect(writtenData.numTotalEvalSuites).toBe(2);
      expect(writtenData.numTotalEvals).toBe(2);
      expect(writtenData.numPassedEvals).toBe(2);
      expect(writtenData.evalResults).toHaveLength(2);
    });

    it('should skip suites without eval results', () => {
      const mockFiles = [
        {
          filepath: '/test/regular.ts',
          name: 'Regular Test',
          result: {
            startTime: Date.now() - 1000,
            endTime: Date.now(),
            state: 'pass',
          },
          tasks: [
            {
              name: 'Regular Test',
            },
          ],
        },
      ];

      reporter.onFinished(mockFiles);

      const writtenData = JSON.parse(mockWriteFileSync.mock.calls[0][1]);

      expect(writtenData.numTotalEvalSuites).toBe(0);
      expect(writtenData.numTotalEvals).toBe(0);
      expect(writtenData.evalResults).toHaveLength(0);
    });
  });

  describe('file output', () => {
    it('should create directory if it does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      reporter = new JsonReporter({ outputFile: 'results/test.json' });

      reporter.onInit();

      expect(mockMkdirSync).toHaveBeenCalledWith('/absolute', {
        recursive: true,
      });
      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it('should write to stdout when no output file specified', () => {
      const mockStdoutWrite = vi
        .spyOn(process.stdout, 'write')
        .mockImplementation(() => true);
      reporter = new JsonReporter();

      reporter.onInit();

      expect(mockStdoutWrite).toHaveBeenCalled();
      expect(mockWriteFileSync).not.toHaveBeenCalled();

      mockStdoutWrite.mockRestore();
    });
  });

  describe('summary calculations', () => {
    beforeEach(() => {
      reporter = new JsonReporter({ outputFile: 'test-results.json' });
      reporter.onInit();
      vi.clearAllMocks();
    });

    it('should calculate correct summary metrics', () => {
      const mockEvalResults: EvalResult[] = [
        {
          name: 'eval-1',
          mean: 0.8,
          median: 0.85,
          sum: 3.2,
          threshold: 0.7,
          aggregation: 'mean',
          scores: [0.8, 0.85, 0.75, 0.8],
        },
        {
          name: 'eval-2',
          mean: 0.6,
          median: 0.65,
          sum: 2.4,
          threshold: 0.7,
          aggregation: 'median',
          scores: [0.6, 0.65, 0.55, 0.6],
        },
      ];

      const mockFile = {
        filepath: '/test/suite.ts',
        name: 'Test Suite',
        result: {
          startTime: Date.now() - 1000,
          endTime: Date.now(),
          state: 'pass',
        },
        meta: {
          results: mockEvalResults,
        },
      };

      reporter.onFinished([mockFile]);

      const writtenData = JSON.parse(mockWriteFileSync.mock.calls[0][1]);
      const summary = writtenData.evalResults[0].summary;

      expect(summary.meanScore).toBeCloseTo(0.7);
      expect(summary.medianScore).toBeCloseTo(0.75);
      expect(summary.sumScore).toBeCloseTo(5.6);
      expect(summary.passedCount).toBe(1); // Only first eval passes
      expect(summary.totalCount).toBe(2);
    });
  });

  describe('incremental updates', () => {
    beforeEach(() => {
      reporter = new JsonReporter({ outputFile: 'test-results.json' });
      reporter.onInit();
      vi.clearAllMocks();
    });

    it('should update results when onTaskUpdate is called', () => {
      const mockEvalResults: EvalResult[] = [
        {
          name: 'test-eval-1',
          mean: 0.8,
          median: 0.85,
          sum: 4.0,
          threshold: 0.7,
          aggregation: 'mean',
          scores: [0.8, 0.85, 0.75, 0.8],
        },
      ];

      const mockTask = {
        file: {
          filepath: '/test/suite.ts',
        },
        meta: {
          results: mockEvalResults,
        },
      };

      const mockPack = [null, mockTask];

      reporter.onTaskUpdate([mockPack]);

      expect(mockWriteFileSync).toHaveBeenCalled();
      const writtenData = JSON.parse(
        mockWriteFileSync.mock.calls[mockWriteFileSync.mock.calls.length - 1][1]
      );
      expect(writtenData.numTotalEvals).toBe(1);
      expect(writtenData.numPassedEvals).toBe(1);
    });

    it('should update results when onTestFinished is called', () => {
      const mockEvalResults: EvalResult[] = [
        {
          name: 'test-eval-1',
          mean: 0.6,
          median: 0.6,
          sum: 2.4,
          threshold: 0.7,
          aggregation: 'mean',
          scores: [0.6, 0.6, 0.6, 0.6],
        },
      ];

      const mockTest = {
        file: {
          filepath: '/test/suite.ts',
        },
        meta: {
          results: mockEvalResults,
        },
      };

      reporter.onTestFinished(mockTest);

      expect(mockWriteFileSync).toHaveBeenCalled();
      const writtenData = JSON.parse(
        mockWriteFileSync.mock.calls[mockWriteFileSync.mock.calls.length - 1][1]
      );
      expect(writtenData.numTotalEvals).toBe(1);
      expect(writtenData.numPassedEvals).toBe(0);
      expect(writtenData.numFailedEvals).toBe(1);
    });

    it('should accumulate results from multiple tests in same suite', () => {
      const mockEvalResults1: EvalResult[] = [
        {
          name: 'test-eval-1',
          mean: 0.8,
          median: 0.8,
          sum: 3.2,
          threshold: 0.7,
          aggregation: 'mean',
          scores: [0.8, 0.8, 0.8, 0.8],
        },
      ];

      const mockEvalResults2: EvalResult[] = [
        {
          name: 'test-eval-2',
          mean: 0.9,
          median: 0.9,
          sum: 3.6,
          threshold: 0.8,
          aggregation: 'median',
          scores: [0.9, 0.9, 0.9, 0.9],
        },
      ];

      const suiteId = '/test/suite.ts';

      // First test completion
      const mockTest1 = {
        file: { filepath: suiteId },
        meta: { results: mockEvalResults1 },
      };

      reporter.onTestFinished(mockTest1);

      let writtenData = JSON.parse(
        mockWriteFileSync.mock.calls[mockWriteFileSync.mock.calls.length - 1][1]
      );
      expect(writtenData.numTotalEvals).toBe(1);
      expect(writtenData.numPassedEvals).toBe(1);

      // Second test completion
      const mockTest2 = {
        file: { filepath: suiteId },
        meta: { results: mockEvalResults2 },
      };

      reporter.onTestFinished(mockTest2);

      writtenData = JSON.parse(
        mockWriteFileSync.mock.calls[mockWriteFileSync.mock.calls.length - 1][1]
      );
      expect(writtenData.numTotalEvals).toBe(2);
      expect(writtenData.numPassedEvals).toBe(2);
    });

    it('should handle onFinished with previously accumulated results', () => {
      const mockEvalResults: EvalResult[] = [
        {
          name: 'test-eval-1',
          mean: 0.8,
          median: 0.8,
          sum: 3.2,
          threshold: 0.7,
          aggregation: 'mean',
          scores: [0.8, 0.8, 0.8, 0.8],
        },
      ];

      const suiteId = '/test/suite.ts';

      // First, simulate test completion
      const mockTest = {
        file: { filepath: suiteId },
        meta: { results: mockEvalResults },
      };

      reporter.onTestFinished(mockTest);

      // Clear mocks to focus on onFinished call
      vi.clearAllMocks();

      // Then call onFinished for the suite
      const mockFile = {
        filepath: suiteId,
        name: 'Test Suite',
        result: {
          startTime: Date.now() - 1000,
          endTime: Date.now(),
          state: 'pass',
        },
        tasks: [
          {
            name: 'Test Suite',
          },
        ],
      };

      reporter.onFinished([mockFile]);

      const writtenData = JSON.parse(
        mockWriteFileSync.mock.calls[mockWriteFileSync.mock.calls.length - 1][1]
      );
      expect(writtenData.status).toBe('finished');
      expect(writtenData.numTotalEvalSuites).toBe(1);
      expect(writtenData.evalResults).toHaveLength(1);
      expect(writtenData.evalResults[0].evalResults).toEqual(mockEvalResults);
    });
  });
});
