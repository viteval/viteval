import { notFound } from 'next/navigation';
import { FlaskConical, Play } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { match } from 'ts-pattern';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDuration, formatTimestamp } from '@/lib/utils';
import { vitevalReader } from '@/lib/viteval';

export default async function SuiteDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  // Find the suite and all its runs
  const results = await vitevalReader.listResults();
  const runs: Array<{
    timestamp: string;
    status: string;
    duration: number;
    meanScore: number;
    passedCount: number;
    totalCount: number;
  }> = [];

  let filepath: string | undefined;
  let latestSource: string | null = null;

  for (const result of results) {
    const full = await vitevalReader.readResult(result.timestamp);
    if (!full?.evalResults) continue;

    for (const suite of full.evalResults) {
      if (suite.name === decodedName) {
        if (!filepath) filepath = suite.filepath;
        runs.push({
          timestamp: result.timestamp,
          status: suite.status,
          duration: suite.duration,
          meanScore: suite.summary.meanScore,
          passedCount: suite.summary.passedCount,
          totalCount: suite.summary.totalCount,
        });
      }
    }
  }

  if (runs.length === 0) {
    notFound();
  }

  // Try to read the source file
  if (filepath) {
    const schema = await vitevalReader.readSchema(filepath);
    if (schema) latestSource = schema.content;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-6 w-6" />
            {decodedName}
          </h1>
          {filepath && (
            <code className="text-sm text-muted-foreground mt-1 inline-block">
              {filepath}
            </code>
          )}
        </div>
        <Button variant="outline" disabled title="Run eval (coming soon)">
          <Play className="h-4 w-4" />
          Run
        </Button>
      </div>

      {latestSource && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md overflow-hidden border text-sm">
              <SyntaxHighlighter
                language="typescript"
                style={oneDark}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  background: 'transparent',
                  fontSize: '0.8rem',
                }}
                showLineNumbers
                lineNumberStyle={{ color: 'var(--muted-foreground)', opacity: 0.5 }}
              >
                {latestSource}
              </SyntaxHighlighter>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Run History ({runs.length} run{runs.length !== 1 ? 's' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {runs.map((run) => (
            <a
              key={run.timestamp}
              href={`/results/${run.timestamp}`}
              className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted transition-colors"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-mono text-muted-foreground">
                  {run.timestamp}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(run.timestamp)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {formatDuration(run.duration)}
                </span>
                <span className="text-xs">
                  {run.passedCount}/{run.totalCount}
                </span>
                {match(run.status)
                  .with('passed', () => <Badge variant="default">Passed</Badge>)
                  .with('failed', () => (
                    <Badge variant="destructive">Failed</Badge>
                  ))
                  .with('running', () => (
                    <Badge
                      variant="outline"
                      className="text-yellow-600 border-yellow-600 animate-pulse"
                    >
                      Running
                    </Badge>
                  ))
                  .otherwise((s) => <Badge variant="secondary">{s}</Badge>)}
              </div>
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
