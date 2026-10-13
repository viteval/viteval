import { z } from 'zod';
import type { TagEntityType } from '@/types';
import { createViteval } from '@/sdk';

const VALID_ENTITY_TYPES: readonly TagEntityType[] = [
  'eval_run',
  'eval_result',
  'dataset',
  'dataset_item',
] as const;

const addTaggingSchema = z.object({
  tagId: z.string().min(1),
  entityType: z.enum(VALID_ENTITY_TYPES),
  entityId: z.string().min(1),
});

function parseEntityType(value: string | null): TagEntityType | null {
  if (!value) {
    return null;
  }
  return VALID_ENTITY_TYPES.includes(value as TagEntityType)
    ? (value as TagEntityType)
    : null;
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
  const parsed = addTaggingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'tagId, entityType, and entityId are required' },
      { status: 400 }
    );
  }

  const result = await viteval.tags.addTagging(parsed.data);
  if ('error' in result) {
    return Response.json(result, { status: 500 });
  }

  return Response.json(result);
}

export async function DELETE(request: Request) {
  const viteval = createViteval();
  const { searchParams } = new URL(request.url);
  const tagId = searchParams.get('tagId');
  const entityType = parseEntityType(searchParams.get('entityType'));
  const entityId = searchParams.get('entityId');

  if (!tagId || !entityType || !entityId) {
    return Response.json(
      { error: 'tagId, entityType, and entityId are required' },
      { status: 400 }
    );
  }

  const result = await viteval.tags.removeTagging({
    entityId,
    entityType,
    tagId,
  });
  return 'error' in result
    ? Response.json(result, { status: 500 })
    : Response.json(result);
}
