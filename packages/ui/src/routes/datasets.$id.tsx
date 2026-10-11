import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { DatabaseIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { FilePath, ProviderBadge } from '@/components/display';
import DatasetDetail from '@/components/DatasetDetail';
import { TagList } from '@/components/tag';
import { Button } from '@/components/ui/button';
import { getDataset } from '@/server/page-functions';

export const Route = createFileRoute('/datasets/$id')({
  loader: async ({ params }) => {
    const response = await getDataset({ data: params });
    if ('error' in response) throw new Error(response.error);
    if (!response.data) {
      throw notFound();
    }
    return response.data;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.name ?? 'Dataset'} | Viteval` }],
  }),
  component: DatasetDetailPage,
  errorComponent: ({ error }) => (
    <div className="container mx-auto p-6 space-y-6 overflow-hidden">
      <PageHeader
        title="Error"
        description={error instanceof Error ? error.message : String(error)}
      />
    </div>
  ),
});

function DatasetDetailPage() {
  const dataset = Route.useLoaderData();

  return (
    <div className="container mx-auto p-6 space-y-6 overflow-hidden">
      <PageHeader
        icon={<DatabaseIcon className="h-6 w-6" />}
        title={dataset.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {dataset.description && <span>{dataset.description}</span>}
            {dataset.path && <FilePath path={dataset.path} />}
            <Badge variant="secondary" className="text-xs">
              {dataset.data.length} items
            </Badge>
            <ProviderBadge provider={dataset.source} />
          </span>
        }
        actions={
          <Button variant="outline" asChild>
            <Link to="/datasets">&larr; Back to Datasets</Link>
          </Button>
        }
      />
      <TagList entityType="dataset" entityId={dataset.id} />
      <h3 className="text-sm font-medium">Items</h3>
      <DatasetDetail dataset={dataset} />
    </div>
  );
}
