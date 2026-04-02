import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import DatasetDetail from '@/components/DatasetDetail';
import { Button } from '@/components/ui/button';
import { createViteval } from '@/sdk';

const viteval = createViteval();

export default async function DatasetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: dataset } = await viteval.datasets.get({ id });

  if (!dataset) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        icon={<Database className="h-6 w-6" />}
        title={dataset.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {dataset.description && (
              <span>{dataset.description}</span>
            )}
            <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
              {dataset.path}
            </code>
            <Badge variant="secondary" className="text-xs">
              {dataset.data.length} items
            </Badge>
            <Badge variant="outline" className="text-xs">
              {dataset.storage}
            </Badge>
          </span>
        }
        actions={
          <Button variant="outline" asChild>
            <Link href="/datasets">&larr; Back to Datasets</Link>
          </Button>
        }
      />
      <h3 className="text-sm font-medium">Items</h3>
      <DatasetDetail dataset={dataset} />
    </div>
  );
}
