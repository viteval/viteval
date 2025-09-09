import { Icon } from '@iconify/react'
import { Await, createFileRoute, } from '@tanstack/react-router'
import { listResults } from '@/fx/results'
import ResultsList from '../components/ResultsList'

export const Route = createFileRoute('/results/')({
  loader: async () => {
    return {
      results: listResults()
    }
  },
  shouldReload: () => true,
  component: ResultsPage,
});

function ResultsPage() {
  const { results: initialResults } = Route.useLoaderData();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Icon icon="mdi:chart-box" width={24} />
          Results
        </h1>
        <p className="text-muted-foreground">
          View and analyze your evaluation results
        </p>
      </div>
      <Await promise={initialResults} fallback={<div>Loading results...</div>}>
        {(results) => <ResultsList results={results} />}
      </Await>
    </div>
  )
}