import { z } from 'zod';
import type { TagEntityType } from '@/types';
import { createViteval } from '@/sdk';

const createTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  description: z.string().optional(),
});

export async function GET(request: Request) {
  const viteval = createViteval();
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
  const viteval = createViteval();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Invalid JSON request body' },
      { status: 400 }
    );
  }
  const parsed = createTagSchema.safeParse(body);
  if (!parsed.success) {
    const error = parsed.error.issues.some((issue) => issue.path[0] === 'name')
      ? 'name is required'
      : parsed.error.message;
    return Response.json({ error }, { status: 400 });
  }

  const result = await viteval.tags.create(parsed.data);
  if ('error' in result) {
    return Response.json(result, { status: 500 });
  }

  return Response.json(result);
}
