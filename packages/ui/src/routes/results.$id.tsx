import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { getResult } from '@/fx/results'
import ResultsDetail from '../components/ResultsDetail'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

export const Route = createFileRoute('/results/$id')({
  loader: async ({ params }) => {
    try {
      const results = await getResult({
        data: { id: params.id }
      })

      if (!results) {
        return { results: null, notFound: true, error: null }
      }

      return { results, notFound: false, error: null }
    } catch (error) {
      return { results: null, notFound: false, error: error instanceof Error ? error.message : 'Failed to load result' }
    }
  },
  component: ResultDetailPage,
});

function ResultDetailPage() {
  const { id } = Route.useParams()
  const { results, notFound, error } = Route.useLoaderData()

  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      void router.invalidate()
    }, 20000)
    return () => clearInterval(interval)
  }, [router])

  if (notFound || !results) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Result Not Found</h1>
            <p className="text-muted-foreground">
              The evaluation result with ID "{id}" could not be found.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/">← Back to Results</Link>
          </Button>
        </div>

        <Card>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl mb-4">404</div>
              <div className="text-xl font-semibold mb-2">Evaluation Result Not Found</div>
              <div className="text-sm text-muted-foreground">
                The result file may have been deleted or the ID may be incorrect.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Results:</h1><code className="text-sm text-muted-foreground px-2 py-1 rounded-md bg-muted">{id}</code>
          </div>
          <p className="text-muted-foreground">
            Detailed evaluation results and metrics
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/results">← Back to Results</Link>
        </Button>
      </div>
      <ResultsDetail results={results} error={error} />
    </div>
  )

}