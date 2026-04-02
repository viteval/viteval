import { Suspense } from 'react';
import { Database } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { DatasetsList } from '@/components/datasets-list';
import { createViteval } from '@/sdk';

const viteval = createViteval();

export default async function DatasetsPage() {
  const { data: datasets } = await viteval.datasets.list({ limit: 50 });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        icon={<Database className="h-6 w-6" />}
        title="Datasets"
        description="View and manage your evaluation datasets"
      />
      <Suspense>
        <DatasetsList datasets={datasets} />
      </Suspense>
    </div>
  );
}
