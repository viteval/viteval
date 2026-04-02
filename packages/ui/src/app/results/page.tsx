import { Suspense } from 'react';
import { ResultsIcon } from '@/components/icons';
import { PageHeader } from '@/components/page-header';
import { ResultsList } from '@/components/results-list';
import { createViteval } from '@/sdk';

const viteval = createViteval();

export default async function ResultsPage() {
  const { data: results, total } = await viteval.results.list({
    limit: 20,
    page: 1,
  });

  return (
    <div className="container mx-auto p-6 space-y-6 overflow-hidden">
      <PageHeader
        icon={<ResultsIcon className="h-6 w-6" />}
        title="Results"
        description={`View and analyze your evaluation results (${total} total)`}
      />
      <Suspense>
        <ResultsList results={results} total={total} />
      </Suspense>
    </div>
  );
}
