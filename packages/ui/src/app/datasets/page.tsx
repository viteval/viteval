import { Suspense } from 'react';
import { Database } from 'lucide-react';
import { DatasetsList } from '@/components/datasets-list';
import { vitevalReader } from '@/lib/viteval';

export default async function DatasetsPage() {
  const datasets = await vitevalReader.listDatasets();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Database className="h-6 w-6" />
          Datasets
        </h1>
        <p className="text-muted-foreground">
          View and manage your evaluation datasets
        </p>
      </div>
      <Suspense>
        <DatasetsList datasets={datasets} />
      </Suspense>
    </div>
  );
}
