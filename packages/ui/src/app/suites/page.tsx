import { Suspense } from 'react';
import { EvalsIcon } from '@/components/icons';
import { PageHeader } from '@/components/page-header';
import { SuitesList } from '@/components/suites-list';
import { createViteval } from '@/sdk';

const viteval = createViteval();

export default async function SuitesPage() {
  const { data: suites } = await viteval.suites.list({ limit: 50 });

  return (
    <div className="container mx-auto p-6 space-y-6 overflow-hidden">
      <PageHeader
        icon={<EvalsIcon className="h-6 w-6" />}
        title="Evals"
        description="All evaluations across runs"
      />
      <Suspense>
        <SuitesList suites={suites} />
      </Suspense>
    </div>
  );
}
