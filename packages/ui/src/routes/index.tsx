import { Await, createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react';
import { listResults } from '@/fx/results'
import ResultsList from '../components/ResultsList'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  loader: async () => {
    return {
      results: listResults({ data: { afterId: undefined, limit: 10 } })
    }
  },
  shouldReload: () => true,
  component: ResultsPage,
});

function ResultsPage() {
  const { results: initialResults } = Route.useLoaderData();
  const router = useRouter()
  const [allResults, setAllResults] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      void router.invalidate()
    }, 20000)
    return () => clearInterval(interval)
  }, [router])

  useEffect(() => {
    if (!initialized) {
      initialResults.then((data) => {
        setAllResults(data.results);
        setNextCursor(data.next);
        setInitialized(true);
      });
    }
  }, [initialResults, initialized]);

  const loadMore = async () => {
    if (!nextCursor || loading) return;
    
    setLoading(true);
    try {
      const moreResults = await listResults({ data: { afterId: nextCursor, limit: 10 } });
      setAllResults(prev => [...prev, ...moreResults.results]);
      setNextCursor(moreResults.next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Results</h1>
        <p className="text-muted-foreground">
          View and analyze your evaluation results
        </p>
      </div>
      {initialized ? (
        <div className="space-y-4">
          <ResultsList results={allResults} />
          {nextCursor && (
            <div className="flex justify-center">
              <Button 
                onClick={loadMore} 
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Await promise={initialResults} fallback={<div>Loading results...</div>}>
          {() => null}
        </Await>
      )}
    </div>
  )
}