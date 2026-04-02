import { createViteval } from '@/sdk';

const viteval = createViteval();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 20);
  const status = searchParams.get('status') as
    | 'running'
    | 'finished'
    | undefined;
  const suite = searchParams.get('suite') ?? undefined;

  const result = await viteval.results.list({ limit, page, status, suite });
  return Response.json(result);
}
