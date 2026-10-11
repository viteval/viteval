import { DatabaseIcon } from '@/components/icons';
import { PageHeader } from '@/components/page-header';
import { DatasetsList } from '@/components/datasets-list';
import { createViteval, parsePaginateParams } from '@/sdk';

const viteval = createViteval();

export default async function DatasetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { data: datasets, warnings } = await viteval.datasets.list(
    parsePaginateParams(params)
  );

  return (
    <div className="container mx-auto p-6 space-y-6 overflow-hidden">
      <PageHeader
        icon={<DatabaseIcon className="h-6 w-6" />}
        title="Datasets"
        description="View and manage your evaluation datasets"
      />
      {warnings?.map((warning) => (
        <p role="alert" key={warning} className="text-destructive text-sm">
          {warning}
        </p>
      ))}
      <DatasetsList datasets={datasets} />
    </div>
  );
}
