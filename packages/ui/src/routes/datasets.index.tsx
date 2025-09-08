import { Await, createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDatasets } from '@/fx/datasets'
import type { DatasetSummary } from '@/types'

export const Route = createFileRoute('/datasets/')({
  loader: async () => {
    return { datasets: getDatasets({ data: { afterId: undefined, limit: 10 } }) }
  },
  component: DatasetsPage,
})

function DatasetsPage() {
  const { datasets: initialDatasets } = Route.useLoaderData()
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Datasets</h1>
        <p className="text-muted-foreground">
          View and manage your evaluation datasets
        </p>
      </div>
      <Await promise={initialDatasets} fallback={<div>Loading datasets...</div>}>
        {(datasets) => <DatasetsInnerPage initialDatasets={datasets} />}
      </Await>
    </div>
  )
}

function DatasetsInnerPage({ initialDatasets }: { initialDatasets: { results: DatasetSummary[]; next?: string } }) {
  const [allDatasets, setAllDatasets] = useState<DatasetSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setAllDatasets(initialDatasets.results);
      setNextCursor(initialDatasets.next);
      setInitialized(true);
    }
  }, [initialDatasets, initialized]);

  const loadMore = async () => {
    if (!nextCursor || loading) return;

    setLoading(true);
    try {
      const moreDatasets = await getDatasets({ data: { afterId: nextCursor, limit: 10 } });
      setAllDatasets(prev => [...prev, ...moreDatasets.results]);
      setNextCursor(moreDatasets.next);
    } finally {
      setLoading(false);
    }
  };

  if (allDatasets.length === 0) {
    return (
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
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {allDatasets.map((dataset) => (
          <Link
            key={dataset.id}
            to="/datasets/$id"
            params={{ id: dataset.id }}
            className="block"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate text-lg">{dataset.name}</span>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {dataset.itemCount} items
                  </Badge>
                </CardTitle>
                <div>
                  <code className="text-sm text-muted-foreground px-2 py-1 rounded-md bg-muted">{dataset.path}</code>
                </div>
              </CardHeader>
              <CardContent>
                {dataset.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {dataset.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
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
  )
}