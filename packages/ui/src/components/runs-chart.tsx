'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { ResultFile } from '@/types';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RunsChartProps {
  results: ResultFile[];
}

const chartConfig = {
  failed: {
    label: 'Failed',
    color: 'var(--color-chart-5)',
  },
  passed: {
    label: 'Passed',
    color: 'var(--color-chart-2)',
  },
} satisfies ChartConfig;

export function RunsChart({ results }: RunsChartProps) {
  const data = results
    .filter((r) => r.summary)
    .toReversed()
    .slice(-20)
    .map((r) => {
      const ts = new Date(Number(r.timestamp));
      return {
        failed: r.summary!.numFailedEvals,
        label: `${ts.getMonth() + 1}/${ts.getDate()} ${ts.getHours().toString().padStart(2, '0')}:${ts.getMinutes().toString().padStart(2, '0')}`,
        passed: r.summary!.numPassedEvals,
      };
    });

  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Eval Runs — Passed vs Failed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <BarChart data={data} barGap={1}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              fontSize={10}
              tick={{ fill: 'var(--color-muted-foreground)' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={10}
              allowDecimals={false}
              tick={{ fill: 'var(--color-muted-foreground)' }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="passed"
              stackId="a"
              fill="var(--color-passed)"
              radius={[0, 0, 1, 1]}
            />
            <Bar
              dataKey="failed"
              stackId="a"
              fill="var(--color-failed)"
              radius={[1, 1, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
