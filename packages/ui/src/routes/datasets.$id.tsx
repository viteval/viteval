import { createFileRoute, Link } from '@tanstack/react-router'
import DatasetDetail from '@/components/DatasetDetail'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getDataset } from '@/fx/datasets'

export const Route = createFileRoute('/datasets/$id')({
  loader: async ({ params }) => {
    try {
      const dataset = await getDataset({ data: { id: params.id } })

      if (!dataset) {
        return { dataset: null, notFound: true, error: null }
      }

      return { dataset, notFound: false, error: null }
    } catch (error) {
      return {
        dataset: null,
        notFound: false,
        error: error instanceof Error ? error.message : 'Failed to load dataset'
      }
    }
  },
  component: DatasetDetailPage,
})

function DatasetDetailPage() {
  const { id } = Route.useParams()
  const { dataset, notFound, error } = Route.useLoaderData()

  if (notFound || !dataset) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dataset Not Found</h1>
            <p className="text-muted-foreground">
              The dataset with ID "{id}" could not be found.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/datasets">← Back to Datasets</Link>
          </Button>
        </div>

        <Card>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl mb-4">404</div>
              <div className="text-xl font-semibold mb-2">Dataset Not Found</div>
              <div className="text-sm text-muted-foreground">
                The dataset may have been deleted or the ID may be incorrect.
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
            <h1 className="text-3xl font-bold tracking-tight">Dataset:</h1>
            <code className="text-sm text-muted-foreground px-2 py-1 rounded-md bg-muted">{dataset.name}</code>
          </div>
          {dataset.description && (
            <p className="text-muted-foreground mt-1">
              {dataset.description}
            </p>
          )}
        </div>
        <Button variant="outline" asChild>
          <Link to="/datasets">← Back to Datasets</Link>
        </Button>
      </div>

      <DatasetDetail dataset={dataset} error={error} />
    </div>
  )
}