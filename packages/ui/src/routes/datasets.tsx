import { createFileRoute, Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDatasets } from '@/fx/datasets'

export const Route = createFileRoute('/datasets')({
  loader: async () => {
    const datasets = await getDatasets({ data: { afterId: undefined, limit: 50 } })
    return { datasets }
  },
  component: DatasetsPage,
})

function DatasetsPage() {
  const { datasets } = Route.useLoaderData()

  if (datasets.results.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Datasets</h1>
          <p className="text-muted-foreground">
            View and manage your evaluation datasets
          </p>
        </div>

        <Card>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📊</div>
              <div className="text-xl font-semibold mb-2">No Datasets Found</div>
              <div className="text-sm text-muted-foreground">
                No datasets were found in the .viteval/datasets directory.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Datasets</h1>
        <p className="text-muted-foreground">
          View and manage your evaluation datasets ({datasets.results.length} found)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {datasets.results.map((dataset) => (
          <Link
            key={dataset.id}
            to="/datasets/$id"
            params={{ id: dataset.id }}
            className="block"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{dataset.name}</span>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {dataset.itemCount} items
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dataset.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {dataset.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {dataset.storage}
                    </Badge>
                  </div>
                  {dataset.createdAt && (
                    <span>
                      {new Date(dataset.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}