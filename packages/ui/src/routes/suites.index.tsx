import { createFileRoute } from '@tanstack/react-router';
import { EvalsIcon } from '@/components/icons';
import { PageHeader } from '@/components/page-header';
import { SuitesList } from '@/components/suites-list';
import { suitesSearchSchema } from '@/server/search';
import { useRemoteTable } from '@/hooks/use-remote-table';
import { getSuites } from '@/server/page-functions';

export const Route = createFileRoute('/suites/')({
  validateSearch: suitesSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getSuites({ data: deps }),
  head: () => ({ meta: [{ title: 'Evals | Viteval' }] }),
  component: SuitesPage,
});

function SuitesPage() {
  const response = Route.useLoaderData();
  const { data: suites } = response;
  const remote = useRemoteTable(response);

  return (
    <div className="container mx-auto p-6 space-y-6 overflow-hidden">
      <PageHeader
        icon={<EvalsIcon className="h-6 w-6" />}
        title="Evals"
        description="All evaluations across runs"
      />
      <SuitesList suites={suites} remote={remote} />
    </div>
  );
}
