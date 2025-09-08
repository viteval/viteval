import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { getStatusBadge } from '../lib/badges'
import { formatDuration } from '../lib/utils'
import type { EvalResult, EvalResults, EvalSuite, Score } from '../types'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from './ui/card'
import { Collapsible, CollapsibleContent } from './ui/collapsible'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { ValueRenderer } from './ValueRenderer'

interface ResultsDetailProps {
  results: EvalResults
  loading?: boolean
  error?: string | null
}


function EvalResultRow({ evalResult }: { evalResult: EvalResult }) {
  const [isOpen, setIsOpen] = useState(false)
  const hasDetails = evalResult.input !== undefined || evalResult.expected !== undefined || evalResult.output !== undefined

  return (
    <>
      <TableRow
        className={hasDetails ? "cursor-pointer hover:bg-muted/50" : ""}
        onClick={() => hasDetails && setIsOpen(!isOpen)}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {hasDetails && (
              <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
            {evalResult.name}
          </div>
        </TableCell>
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
      {hasDetails && isOpen && (
        <TableRow>
          <TableCell colSpan={6} className="p-0">
            <Collapsible open={isOpen}>
              <CollapsibleContent>
                <div className="bg-muted/30 p-4 space-y-4">
                  {evalResult.input !== undefined && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Input:</h4>
                      <ValueRenderer value={evalResult.input} label="Input" />
                    </div>
                  )}
                  {evalResult.expected !== undefined && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Expected Output:</h4>
                      <ValueRenderer value={evalResult.expected} label="Expected output" />
                    </div>
                  )}
                  {evalResult.output !== undefined && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Actual Output:</h4>
                      <ValueRenderer value={evalResult.output} label="Actual output" />
                    </div>
                  )}
                  {evalResult.metadata && Object.keys(evalResult.metadata).length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Metadata:</h4>
                      <ValueRenderer value={evalResult.metadata} label="Metadata" />
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </TableCell>
        </TableRow>
      )}
    </>
  )
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
                Click on a row to view the details
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mean</TableHead>
                  <TableHead>Median</TableHead>
                  <TableHead>Sum</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Scores</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suite.evalResults.map((evalResult: EvalResult) => (
                  <EvalResultRow key={evalResult.name} evalResult={evalResult} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}