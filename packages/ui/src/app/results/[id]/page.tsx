'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import ResultsDetail from '@/components/ResultsDetail';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    const interval = setInterval(() => {
      void fetchResult();
    }, 20_000);
    return () => clearInterval(interval);
  }, [fetchResult]);

  if (!loading && notFound) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Result Not Found
            </h1>
            <p className="text-muted-foreground">
              The evaluation result with ID &quot;{id}&quot; could not be found.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/results">&larr; Back to Results</Link>
          </Button>
        </div>

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
      <div className="container mx-auto p-6 space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Error</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/results">&larr; Back to Results</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Results:</h1>
            <code className="text-sm text-muted-foreground px-2 py-1 rounded-md bg-muted">
              {id}
            </code>
          </div>
          <p className="text-muted-foreground">
            Detailed evaluation results and metrics
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/results">&larr; Back to Results</Link>
        </Button>
      </div>
      {results && <ResultsDetail results={results} error={error} />}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading results...</div>
        </div>
      )}
    </div>
  );
}
