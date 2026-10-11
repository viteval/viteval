import { createFileRoute } from '@tanstack/react-router';
import { DatabaseIcon } from '@/components/icons';
import { PageHeader } from '@/components/page-header';
import { DatasetsList } from '@/components/datasets-list';
import { datasetsSearchSchema } from '@/server/search';
import { useRemoteTable } from '@/hooks/use-remote-table';
import { getDatasets } from '@/server/page-functions';

export const Route = createFileRoute('/datasets/')({
  validateSearch: datasetsSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getDatasets({ data: deps }),
  head: () => ({ meta: [{ title: 'Datasets | Viteval' }] }),
  component: DatasetsPage,
});

function DatasetsPage() {
  const response = Route.useLoaderData();
  const { data: datasets, warnings } = response;
  const remote = useRemoteTable(response);

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
      <DatasetsList datasets={datasets} remote={remote} />
    </div>
  );
}
