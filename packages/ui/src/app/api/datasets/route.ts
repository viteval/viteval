import { createViteval } from '@/sdk';

const viteval = createViteval();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 20);

  const result = await viteval.datasets.list({ limit, page });
  return Response.json(result);
}
