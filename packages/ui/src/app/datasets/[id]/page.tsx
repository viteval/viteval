import Link from 'next/link';
import { notFound } from 'next/navigation';
import DatasetDetail from '@/components/DatasetDetail';
import { Button } from '@/components/ui/button';
import { vitevalReader } from '@/lib/viteval';

export default async function DatasetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dataset = await vitevalReader.readDataset(id);

  if (!dataset) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Dataset:
            </h1>
            <code className="text-sm text-muted-foreground px-2 py-1 rounded-md bg-muted">
              {dataset.path}
            </code>
          </div>
          {dataset.description && (
            <p className="text-muted-foreground mt-1">
              {dataset.description}
            </p>
          )}
        </div>
        <Button variant="outline" asChild>
          <Link href="/datasets">&larr; Back to Datasets</Link>
        </Button>
      </div>
      <DatasetDetail dataset={dataset} />
    </div>
  );
}
