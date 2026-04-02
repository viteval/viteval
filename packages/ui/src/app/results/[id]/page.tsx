'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import ResultsDetail from '@/components/ResultsDetail';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getStatusBadge, getSuccessBadge } from '@/lib/badges';
import { formatDuration, formatTimestamp, slugify } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { EvalResults } from '@/types';

export default function ResultDetailPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const [results, setResults] = useState<EvalResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchResult = useCallback(async () => {
    try {
      const res = await fetch(`/api/results/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        setResults(null);
        return;
      }
      if (!res.ok) {
        setError(`Failed to load result (${res.status})`);
        return;
      }
      const data = await res.json();
      setResults(data);
      setError(null);
      setNotFound(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to load result'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchResult();
  }, [fetchResult]);

  useEffect(() => {
    if (results?.status !== 'running') {return;}
    const interval = setInterval(() => {
      void fetchResult();
    }, 20_000);
    return () => clearInterval(interval);
  }, [results?.status, fetchResult]);

  if (!loading && notFound) {
    return (
      <div className="container mx-auto p-6 space-y-6 overflow-hidden">
        <PageHeader
          icon={<BarChart3 className="h-6 w-6" />}
          title="Result Not Found"
          description={`The evaluation result with ID "${id}" could not be found.`}
          actions={
            <Button variant="outline" asChild>
              <Link href="/results">&larr; Back to Results</Link>
            </Button>
          }
        />
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl mb-4">404</div>
              <div className="text-xl font-semibold mb-2">
                Evaluation Result Not Found
              </div>
              <div className="text-sm text-muted-foreground">
                The result file may have been deleted or the ID may be
                incorrect.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!loading && error) {
    return (
      <div className="container mx-auto p-6 space-y-6 overflow-hidden">
        <PageHeader
          icon={<BarChart3 className="h-6 w-6" />}
          title="Error"
          description={error}
          actions={
            <Button variant="outline" asChild>
              <Link href="/results">&larr; Back to Results</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const runName = results?.runName || id;
  const suiteNames =
    results?.evalResults.map((s) => s.name).join(', ') ?? '';
  const subtitle = suiteNames || undefined;

  return (
    <div className="container mx-auto p-6 space-y-6 overflow-hidden">
      <PageHeader
        icon={<BarChart3 className="h-6 w-6" />}
        title={runName}
        description={
          results && (
            <span className="flex flex-wrap items-center gap-2">
              {subtitle && (
                <span className="text-sm text-muted-foreground">
                  {subtitle}
                </span>
              )}
              {results.startTime ? (
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                  {formatTimestamp(results.startTime)}
                </code>
              ) : null}
              {results.status === 'running'
                ? getStatusBadge('running')
                : getSuccessBadge(results.success)}
              <Badge variant="secondary" className="text-xs">
                {results.numTotalEvals} evals
              </Badge>
              <Badge variant="outline" className="text-xs">
                {formatDuration(results.duration)}
              </Badge>
            </span>
          )
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/results">&larr; Back to Results</Link>
            </Button>
            {results && results.evalResults.length === 1 && (
              <Button variant="outline" asChild>
                <Link href={`/suites/${slugify(results.evalResults[0].name)}`}>
                  View Eval
                </Link>
              </Button>
            )}
          </>
        }
      />
      {results && <ResultsDetail results={results} />}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading results...</div>
        </div>
      )}
    </div>
  );
}
