import { createViteval, parsePaginateParams } from '@/sdk';

const SUITE_STATUSES = ['passed', 'failed'] as const;
type SuiteStatus = (typeof SUITE_STATUSES)[number];

function parseStatus(value: string | null): SuiteStatus | undefined {
  if (!value) {
    return undefined;
  }
  return SUITE_STATUSES.includes(value as SuiteStatus)
    ? (value as SuiteStatus)
    : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = parseStatus(searchParams.get('status'));

  const viteval = createViteval();
  const result = await viteval.suites.list({
    ...parsePaginateParams(searchParams),
    status,
  });
  return Response.json(result);
}
