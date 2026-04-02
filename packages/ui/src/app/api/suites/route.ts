import { createViteval } from '@/sdk';

const viteval = createViteval();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 50);
  const status = searchParams.get('status') as
    | 'passed'
    | 'failed'
    | undefined;

  const result = await viteval.suites.list({ limit, page, status });
  return Response.json(result);
}
