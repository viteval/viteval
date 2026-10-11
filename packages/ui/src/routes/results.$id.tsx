import {
  createFileRoute,
  Link,
  notFound as routeNotFound,
} from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { ResultsIcon } from '@/components/icons';
import { PageHeader } from '@/components/page-header';
import ResultsDetail from '@/components/ResultsDetail';
import { TagList } from '@/components/tag';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getStatusBadge, getSuccessBadge } from '@/lib/badges';
import { useSettings } from '@/hooks/use-settings';
import { suiteId } from '@/lib/suite-id';
import { suiteName } from '@/lib/suite-name';
import { Badge } from '@/components/ui/badge';
import type { EvalResults } from '@/types';
import { Duration, Timestamp } from '@/components/display';
import { getResult } from '@/server/page-functions';

const DEFAULT_POLL_MS = 20_000;

export const Route = createFileRoute('/results/$id')({
  loader: async ({ params }) => {
    const result = await getResult({ data: params });
    if (!('error' in result) && !result.data) {
      throw routeNotFound();
    }
    return result;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.data?.runName ?? 'Result'} | Viteval` }],
  }),
  component: ResultDetailRoute,
  notFoundComponent: ResultNotFound,
});

function ResultDetailRoute() {
  const { id } = Route.useParams();
  return <ResultDetailPage key={id} />;
}

function ResultDetailPage() {
  const { id } = Route.useParams();
  const initial = Route.useLoaderData();
  const [results, setResults] = useState<EvalResults | null>(
    initial.data ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    'error' in initial ? initial.error : null
  );
  const [notFound, setNotFound] = useState(false);
  const { settings } = useSettings();

  const fetchResult = useCallback(async () => {
    try {
      const res = await fetch(`/api/results/${encodeURIComponent(id)}`);
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
    return <ResultNotFound />;
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
              <Link to="/results">&larr; Back to Results</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const runName = results?.runName || id;
  const suiteNames = results?.evalResults.map(suiteName).join(', ') ?? '';
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
              <Duration ms={results.duration ?? 0} />
            </span>
          )
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/results">&larr; Back to Results</Link>
            </Button>
            {results && results.evalResults.length === 1 && (
              <Button variant="outline" asChild>
                <Link
                  to="/suites/$slug"
                  params={{ slug: suiteId(results.evalResults[0]) }}
                >
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
      {results?.errors?.map((message) => (
        <p role="alert" key={message} className="text-destructive text-sm">
          {message}
        </p>
      ))}
      {results && <ResultsDetail results={results} />}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading results...</div>
        </div>
      )}
    </div>
  );
}

function ResultNotFound() {
  const { id } = Route.useParams();
  return (
    <div className="container mx-auto p-6 space-y-6 overflow-hidden">
      <PageHeader
        icon={<ResultsIcon className="h-6 w-6" />}
        title="Result Not Found"
        description={`The evaluation result with ID "${id}" could not be found.`}
        actions={
          <Button variant="outline" asChild>
            <Link to="/results">&larr; Back to Results</Link>
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
              The result file may have been deleted or the ID may be incorrect.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
