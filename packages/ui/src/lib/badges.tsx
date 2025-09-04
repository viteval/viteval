import { Badge } from '../components/ui/badge'

export function getStatusBadge(status: string) {
  const variant = status === 'passed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'
  return <Badge variant={variant}>{status}</Badge>
}

export function getSuccessBadge(success: boolean) {
  return (
    <Badge variant={success ? 'default' : 'destructive'}>
      {success ? 'Passed' : 'Failed'}
    </Badge>
  )
}

export function getScoreBadge(score: number, threshold: number) {
  const variant = score >= threshold ? 'default' : 'destructive'
  return <Badge variant={variant}>{score.toFixed(3)}</Badge>
}