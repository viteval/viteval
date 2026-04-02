import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import {
  CheckCircle,
  Clock,
  FlaskConical,
  Hash,
  Play,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { ResultsTable } from '@/components/results-table';
import { SourceViewer } from '@/components/source-viewer';
import { StatRow } from '@/components/stat-row';
import { getStatusBadge } from '@/lib/badges';
import { createViteval } from '@/sdk';
import { Duration, FilePath, PassRate, ScoreBadge } from '@/components/display';

const viteval = createViteval();

export default async function EvalDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: suite } = await viteval.suites.get({ slug });
  if (!suite) {
    notFound();
  }

  const { data: suiteResults } = await viteval.results.list({
    limit: 50,
    suite: suite.name,
  });

  let latestSource: string | null = null;
  if (suite.filepath) {
    const { data: schema } = await viteval.schemas.get({
      id: suite.filepath,
    });
    if (schema) {
      latestSource = schema.content;
    }
  }

  const statItems = [
    {
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      label: 'Status',
      value: getStatusBadge(suite.latestStatus),
    },
    {
      icon: <Hash className="h-3.5 w-3.5" />,
      label: 'Runs',
      value: suite.runCount,
    },
    {
      icon: <Target className="h-3.5 w-3.5" />,
      label: 'Mean Score',
      value: <ScoreBadge score={suite.latestMeanScore} />,
    },
    {
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      label: 'Pass Rate',
      value: (
        <PassRate
          passed={suite.latestPassedCount}
          total={suite.latestTotalCount}
        />
      ),
    },
    {
      icon: <Clock className="h-3.5 w-3.5" />,
      label: 'Duration',
      value: <Duration ms={suite.latestDuration} />,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6 overflow-hidden">
      <PageHeader
        icon={<FlaskConical className="h-6 w-6" />}
        title={suite.name}
        description={
          suite.filepath && <FilePath path={suite.filepath} />
        }
        actions={
          <Button variant="outline" disabled title="Run eval (coming soon)">
            <Play className="h-4 w-4" />
            Run
          </Button>
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
          <Suspense>
            <ResultsTable
              results={suiteResults}
              hiddenColumnIds={['suites']}
            />
          </Suspense>
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
