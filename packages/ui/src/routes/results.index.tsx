import { createFileRoute } from '@tanstack/react-router';
import { ResultsIcon } from '@/components/icons';
import { PageHeader } from '@/components/page-header';
import { ResultsList } from '@/components/results-list';
import { paginationSearchSchema } from '@/server/search';
import { getResults } from '@/server/page-functions';

export const Route = createFileRoute('/results/')({
  validateSearch: paginationSearchSchema,
  loaderDeps: ({ search }) => ({ page: search.page, limit: search.limit }),
  loader: ({ deps }) => getResults({ data: deps }),
  head: () => ({ meta: [{ title: 'Results | Viteval' }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const { data: results, total, warnings } = Route.useLoaderData();

  return (
    <div className="container mx-auto p-6 space-y-6 overflow-hidden">
      <PageHeader
        icon={<ResultsIcon className="h-6 w-6" />}
        title="Results"
        description={`View and analyze your evaluation results (${total} total)`}
      />
      {warnings?.map((warning) => (
        <p role="alert" key={warning} className="text-destructive text-sm">
          {warning}
        </p>
      ))}
      <ResultsList results={results} />
    </div>
  );
}
