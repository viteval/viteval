import { EvalsIcon } from '@/components/icons';
import { PageHeader } from '@/components/page-header';
import { SuitesList } from '@/components/suites-list';
import { createViteval, parsePaginateParams } from '@/sdk';

const viteval = createViteval();

export default async function SuitesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { data: suites } = await viteval.suites.list(
    parsePaginateParams(params)
  );

  return (
    <div className="container mx-auto p-6 space-y-6 overflow-hidden">
      <PageHeader
        icon={<EvalsIcon className="h-6 w-6" />}
        title="Evals"
        description="All evaluations across runs"
      />
      <SuitesList suites={suites} />
    </div>
  );
}
