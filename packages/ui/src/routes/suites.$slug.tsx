import { createFileRoute, notFound } from '@tanstack/react-router';
import NotFound from '@/app/not-found';
import {
  CircleCheckIcon,
  ClockIcon,
  EvalsIcon,
  HashIcon,
  TargetIcon,
  TrendingUpIcon,
} from '@/components/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { ResultsList } from '@/components/results-list';
import { SourceViewer } from '@/components/source-viewer';
import { StatRow } from '@/components/stat-row';
import { getStatusBadge } from '@/lib/badges';
import { resultsSearchSchema } from '@/server/search';
import { useRemoteTable } from '@/hooks/use-remote-table';
import { getSuiteDetail } from '@/server/page-functions';
import { Duration, FilePath, PassRate, ScoreBadge } from '@/components/display';

export const Route = createFileRoute('/suites/$slug')({
  validateSearch: resultsSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ params, deps }) => {
    const detail = await getSuiteDetail({
      data: { ...deps, slug: params.slug },
    });
    if (!detail) {
      throw notFound();
    }
    return detail;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.suite.name ?? 'Eval'} | Viteval` }],
  }),
  component: EvalDetailPage,
  notFoundComponent: NotFound,
});

function EvalDetailPage() {
  const { suite, suiteResults, latestSource } = Route.useLoaderData();
  const remote = useRemoteTable(suiteResults);

  const statItems = [
    {
      icon: <CircleCheckIcon className="h-3.5 w-3.5" />,
      label: 'Status',
      value: getStatusBadge(suite.latestStatus),
    },
    {
      icon: <HashIcon className="h-3.5 w-3.5" />,
      label: 'Runs',
      value: suite.runCount,
    },
    {
      icon: <TargetIcon className="h-3.5 w-3.5" />,
      label: 'Mean Score',
      value: <ScoreBadge score={suite.latestMeanScore} />,
    },
    {
      icon: <TrendingUpIcon className="h-3.5 w-3.5" />,
      label: 'Pass Rate',
      value: (
        <PassRate
          passed={suite.latestPassedCount}
          total={suite.latestTotalCount}
        />
      ),
    },
    {
      icon: <ClockIcon className="h-3.5 w-3.5" />,
      label: 'Duration',
      value: <Duration ms={suite.latestDuration} />,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6 overflow-hidden">
      <PageHeader
        icon={<EvalsIcon className="h-6 w-6" />}
        title={suite.name}
        description={suite.filepath && <FilePath path={suite.filepath} />}
        actions={
          suite.filepath && (
            <code className="text-xs">viteval run {suite.filepath}</code>
          )
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {latestSource && <TabsTrigger value="source">Source</TabsTrigger>}
        </TabsList>
        <TabsContent value="overview" className="mt-3 space-y-6">
          <StatRow items={statItems} />
          <h3 className="text-sm font-medium">Runs</h3>
          <ResultsList results={suiteResults.data} remote={remote} />
        </TabsContent>
        {latestSource && (
          <TabsContent value="source" className="mt-3">
            <SourceViewer code={latestSource} filepath={suite.filepath} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
