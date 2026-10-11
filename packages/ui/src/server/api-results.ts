import { createViteval, parsePaginateParams } from '@/sdk';

const RESULT_STATUSES = ['running', 'finished'] as const;
type ResultStatus = (typeof RESULT_STATUSES)[number];

function parseStatus(value: string | null): ResultStatus | undefined {
  if (!value) {
    return undefined;
  }
  return RESULT_STATUSES.includes(value as ResultStatus)
    ? (value as ResultStatus)
    : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = parseStatus(searchParams.get('status'));
  const suite = searchParams.get('suite') ?? undefined;

  const viteval = createViteval();
  const result = await viteval.results.list({
    ...parsePaginateParams(searchParams),
    status,
    suite,
  });
  return Response.json(result);
}
