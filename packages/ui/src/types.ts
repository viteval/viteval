/** biome-ignore-all lint/suspicious/noExplicitAny: We allow any type here since its ONLY for the UI */

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

export interface EvalSuite {
  name: string;
  status: string;
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

export interface SingleEvalResult {
  name: string;
  sum: number;
  median: number;
  mean: number;
  threshold: number;
  aggregation: string;
  scores: Score[];
}

export interface ResultFile {
  id: string;
  name: string;
  path: string;
  timestamp: string;
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
  } | null;
}

export interface DatasetSummary {
  id: string;
  name: string;
  path: string;
  description?: string;
  itemCount: number;
  createdAt?: string;
  storage: string;
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
  path: string;
  description?: string;
  createdAt?: string;
  storage: string;
  data: DatasetItem[];
}
