import { createFileRoute } from '@tanstack/react-router'
import { listResults } from '@/fx/results'
import ResultsList from '../components/ResultsList'

export const Route = createFileRoute('/results')({
  loader: async () => {
    try {
      const results = await listResults()
      return { results, error: null }
    } catch (error) {
      return { results: [], error: error instanceof Error ? error.message : 'Failed to load results' }
    }
  },
  component: ResultsPage,
});

function ResultsPage() {
  const { results, error } = Route.useLoaderData();
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