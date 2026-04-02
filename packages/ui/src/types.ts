/* oxlint-disable no-explicit-any -- UI display types where any is intentional */

export interface Score {
  name: string;
  score: number;
}

export interface EvalResult {
  name: string;
  sum: number;
  median: number;
  mean: number;
  threshold: number;
  aggregation: string;
  scores: Score[];
  input?: any;
  expected?: any;
  output?: any;
  metadata?: Record<string, any>;
}

export type EvalStatus = 'passed' | 'failed' | 'running';

export interface EvalSuite {
  name: string;
  status: EvalStatus;
  filepath?: string;
  startTime: number;
  endTime: number;
  duration: number;
  evalResults: EvalResult[];
  summary: {
    meanScore: number;
    medianScore: number;
    sumScore: number;
    passedCount: number;
    totalCount: number;
  };
}

export interface EvalResults {
  runId?: string;
  runName?: string;
  status: 'running' | 'finished';
  success: boolean;
  numTotalEvalSuites: number;
  numPassedEvalSuites: number;
  numFailedEvalSuites: number;
  numTotalEvals: number;
  numPassedEvals: number;
  numFailedEvals: number;
  startTime: number;
  endTime: number;
  duration: number;
  evalResults: EvalSuite[];
}

export interface ResultFile {
  id: string;
  runId: string;
  name: string;
  path: string;
  size: number;
  summary: {
    status?: 'running' | 'finished';
    success: boolean;
    numTotalEvalSuites: number;
    numPassedEvalSuites: number;
    numFailedEvalSuites: number;
    numTotalEvals: number;
    numPassedEvals: number;
    numFailedEvals: number;
    duration: number;
    startTime: number;
    endTime: number;
    suiteNames: string[];
  } | null;
}

export interface DatasetSummary {
  id: string;
  name: string;
  path?: string;
  description?: string;
  itemCount: number;
  createdAt?: string;
  source: string;
}

export interface EvalSchema {
  id: string;
  name: string;
  path: string;
  content: string;
}

export interface SuiteSummary {
  name: string;
  slug: string;
  filepath?: string;
  runCount: number;
  latestStatus: EvalStatus;
  latestRunTimestamp: string;
  latestDuration: number;
  latestMeanScore: number;
  latestPassedCount: number;
  latestTotalCount: number;
}

export interface DatasetItem {
  id: string;
  name?: string;
  input: any;
  expected?: any;
  metadata?: Record<string, any>;
}

export interface DatasetFile {
  id: string;
  name: string;
  path?: string;
  description?: string;
  createdAt?: string;
  source: string;
  data: DatasetItem[];
}
