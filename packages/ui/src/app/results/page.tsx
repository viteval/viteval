import { ResultsIcon } from '@/components/icons';
import { PageHeader } from '@/components/page-header';
import { ResultsList } from '@/components/results-list';
import { createViteval, parsePaginateParams } from '@/sdk';

const viteval = createViteval();

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { data: results, total } = await viteval.results.list(
    parsePaginateParams(params)
  );

  return (
    <div className="container mx-auto p-6 space-y-6 overflow-hidden">
      <PageHeader
        icon={<ResultsIcon className="h-6 w-6" />}
        title="Results"
        description={`View and analyze your evaluation results (${total} total)`}
      />
      <ResultsList results={results} />
    </div>
  );
}
