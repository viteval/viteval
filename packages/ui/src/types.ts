export interface Score {
  name: string
  score: number
}

export interface EvalResult {
  name: string
  sum: number
  median: number
  mean: number
  threshold: number
  aggregation: string
  scores: Score[]
  input?: unknown
  expected?: unknown
  output?: unknown
  metadata?: Record<string, unknown>
}

export interface EvalSuite {
  name: string
  status: string
  startTime: number
  endTime: number
  duration: number
  evalResults: EvalResult[]
  summary: {
    meanScore: number
    medianScore: number
    sumScore: number
    passedCount: number
    totalCount: number
  }
}

export interface EvalResults {
  success: boolean
  numTotalEvalSuites: number
  numPassedEvalSuites: number
  numFailedEvalSuites: number
  numTotalEvals: number
  numPassedEvals: number
  numFailedEvals: number
  startTime: number
  endTime: number
  duration: number
  evalResults: EvalSuite[]
}

export interface SingleEvalResult {
  name: string
  sum: number
  median: number
  mean: number
  threshold: number
  aggregation: string
  scores: Score[]
}

export interface ResultFile {
  id: string
  name: string
  path: string
  timestamp: string
  size: number
  summary: {
    success: boolean
    numTotalEvalSuites: number
    numPassedEvalSuites: number
    numFailedEvalSuites: number
    numTotalEvals: number
    numPassedEvals: number
    numFailedEvals: number
    duration: number
    startTime: number
    endTime: number
  } | null
}

export interface DatasetSummary {
  id: string
  name: string
  description?: string
  itemCount: number
  createdAt?: string
  storage: string
}

export interface DatasetItem {
  id: string
  name?: string
  input: unknown
  expected?: unknown
  metadata?: Record<string, unknown>
}

export interface DatasetFile {
  id: string
  name: string
  description?: string
  createdAt?: string
  storage: string
  items: DatasetItem[]
}