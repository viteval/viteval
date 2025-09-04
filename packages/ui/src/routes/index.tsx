import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react';
import { listResults } from '@/fx/results'
import ResultsList from '../components/ResultsList'

export const Route = createFileRoute('/')({
  loader: async () => {
    try {
      const results = await listResults()
      return { results, error: null }
    } catch (error) {
      return { results: [], error: error instanceof Error ? error.message : 'Failed to load results' }
    }
  },
  shouldReload: () => true,
  component: ResultsPage,
});

function ResultsPage() {
  const { results, error } = Route.useLoaderData();
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      void router.invalidate()
    }, 20000)
    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Results</h1>
        <p className="text-muted-foreground">
          View and analyze your evaluation results
        </p>
      </div>
      <ResultsList results={results} error={error} />
    </div>
  )
}