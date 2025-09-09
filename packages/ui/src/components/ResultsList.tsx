import { Link } from '@tanstack/react-router'
import { getSuccessBadge } from '../lib/badges'
import { formatDuration, formatFileSize, formatTimestamp } from '../lib/utils'
import type { ResultFile } from '../types'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'


interface ResultsListProps {
  results: ResultFile[]
  loading?: boolean
  error?: string | null
}

export default function ResultsList({ results, loading = false, error }: ResultsListProps) {
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

  if (results.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        No result files found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {results.map((file) => (
        <Link to="/results/$id" params={{ id: file.timestamp }} key={file.path} className="block">
          <Card
            key={file.path}
            className="hover:shadow-md transition-shadow hover:bg-muted"
          >
            <CardContent className="px-4 py-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-muted-foreground px-2 py-1 rounded-md bg-muted">
                      {file.timestamp}
                    </code>
                    <span className="font-medium text-sm text-muted-foreground">
                      {formatTimestamp(file.timestamp)}
                    </span>
                  </div>
                  {file.summary ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Duration</div>
                        <div className="font-medium">
                          {file.summary.status === 'running' && !file.summary.duration
                            ? 'In progress...'
                            : formatDuration(file.summary.duration || 0)
                          }
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Total Evals</div>
                        <div className="font-medium">{file.summary.numTotalEvals}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Passed</div>
                        <div className="font-medium text-green-600">{file.summary.numPassedEvals}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Failed</div>
                        <div className="font-medium text-red-600">{file.summary.numFailedEvals}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Unable to load summary • {formatFileSize(file.size)}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 items-center">
                  {file.summary?.status === 'running' && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600 animate-pulse">
                      Running
                    </Badge>
                  )}
                  {file.summary && getSuccessBadge(file.summary.success)}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}