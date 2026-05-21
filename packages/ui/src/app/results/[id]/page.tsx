'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ResultsIcon } from '@/components/icons';
import { PageHeader } from '@/components/page-header';
import ResultsDetail from '@/components/ResultsDetail';
import { TagList } from '@/components/tag';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getStatusBadge, getSuccessBadge } from '@/lib/badges';
import { useSettings } from '@/hooks/use-settings';
import { slugify } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { EvalResults } from '@/types';
import { Duration, Timestamp } from '@/components/display';

const DEFAULT_POLL_MS = 20_000;

export default function ResultDetailPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const [results, setResults] = useState<EvalResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { settings } = useSettings();

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
    if (results?.status === 'finished' || !results) {
      return;
    }
    const intervalMs =
      settings.autoRefreshInterval > 0
        ? settings.autoRefreshInterval * 1000
        : DEFAULT_POLL_MS;
    const interval = setInterval(() => {
      void fetchResult();
    }, intervalMs);
    return () => clearInterval(interval);
  }, [results, fetchResult, settings.autoRefreshInterval]);

  if (!loading && notFound) {
    return (
      <div className="container mx-auto p-6 space-y-6 overflow-hidden">
        <PageHeader
          icon={<ResultsIcon className="h-6 w-6" />}
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
          icon={<ResultsIcon className="h-6 w-6" />}
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
  const suiteNames = results?.evalResults.map((s) => s.name).join(', ') ?? '';
  const subtitle = suiteNames || undefined;

  return (
    <div className="container mx-auto p-6 space-y-6 overflow-hidden">
      <PageHeader
        icon={<ResultsIcon className="h-6 w-6" />}
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
                <Timestamp value={results.startTime} />
              ) : null}
              {results.status === 'finished'
                ? getSuccessBadge(results.success)
                : getStatusBadge('running')}
              <Badge variant="secondary" className="text-xs">
                {results.numTotalEvals} evals
              </Badge>
              <Duration ms={results.duration} />
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
      {results && (
        <TagList entityType="eval_run" entityId={results.runId ?? id} />
      )}
      {results && <ResultsDetail results={results} />}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading results...</div>
        </div>
      )}
    </div>
  );
}
