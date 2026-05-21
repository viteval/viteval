import type { TagEntityType } from '@/types';
import { createViteval } from '@/sdk';

const viteval = createViteval();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get('entityType') as TagEntityType | null;
  const entityId = searchParams.get('entityId');

  if (entityType && entityId) {
    const result = await viteval.tags.listTaggings({ entityId, entityType });
    return Response.json(result);
  }

  const result = await viteval.tags.list();
  return Response.json(result);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    color?: string;
    description?: string;
  };

  if (!body.name || typeof body.name !== 'string') {
    return Response.json({ error: 'name is required' }, { status: 400 });
  }

  const result = await viteval.tags.create({
    color: body.color,
    description: body.description,
    name: body.name,
  });

  return Response.json(result);
}
