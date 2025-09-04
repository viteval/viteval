import { getStatusBadge } from '../lib/badges'
import { formatDuration } from '../lib/utils'
import type { EvalResult, EvalResults, EvalSuite, Score } from '../types'
import { Badge } from './ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

interface ResultsDetailProps {
  results: EvalResults
  loading?: boolean
  error?: string | null
}

export default function ResultsDetail({ results, loading = false, error }: ResultsDetailProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading results...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-destructive text-center py-8">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{results.numPassedEvals}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{results.numFailedEvals}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{results.numTotalEvals}</div>
              <div className="text-sm text-muted-foreground">Total Evals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatDuration(results.duration)}</div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>
      {results.evalResults.map((suite: EvalSuite) => (
        <Card key={suite.name}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {suite.name}
            </CardTitle>
            <CardAction>
              {getStatusBadge(suite.status)}
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{formatDuration(suite.duration)}</div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{suite.summary.passedCount}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{suite.summary.totalCount - suite.summary.passedCount}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{suite.summary.meanScore.toFixed(3)}</div>
                <div className="text-sm text-muted-foreground">Mean Score</div>
              </div>
            </div>
            <Table>
              <TableCaption>
                Individual evaluation results for {suite.name}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Eval Name</TableHead>
                  <TableHead>Mean</TableHead>
                  <TableHead>Median</TableHead>
                  <TableHead>Sum</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Scores</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suite.evalResults.map((evalResult: EvalResult) => (
                  <TableRow key={evalResult.name}>
                    <TableCell className="font-medium">{evalResult.name}</TableCell>
                    <TableCell>{evalResult.mean.toFixed(3)}</TableCell>
                    <TableCell>{evalResult.median.toFixed(3)}</TableCell>
                    <TableCell>{evalResult.sum}</TableCell>
                    <TableCell>{evalResult.threshold}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {evalResult.scores.map((score: Score, scoreIndex) => (
                          <Badge key={`${score.name}-${scoreIndex}`} variant="outline" className="text-xs">
                            {score.name}: {score.score}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}