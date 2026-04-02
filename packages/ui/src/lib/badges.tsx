import { match } from 'ts-pattern';
import { Badge } from '../components/ui/badge';

export function getStatusBadge(status: string) {
  return match(status)
    .with('passed', () => <Badge variant="success">Passed</Badge>)
    .with('failed', () => <Badge variant="destructive">Failed</Badge>)
    .with('running', () => (
      <Badge
        variant="outline"
        className="text-yellow-600 border-yellow-600 animate-pulse"
      >
        Running
      </Badge>
    ))
    .otherwise((s) => <Badge variant="secondary">{s}</Badge>);
}

export function getSuccessBadge(success: boolean) {
  return (
    <Badge variant={success ? 'success' : 'destructive'}>
      {success ? 'Passed' : 'Failed'}
    </Badge>
  );
}

export function getScoreBadge(score: number, threshold: number) {
  const variant = score >= threshold ? 'success' : 'destructive';
  return <Badge variant={variant}>{score.toFixed(3)}</Badge>;
}
