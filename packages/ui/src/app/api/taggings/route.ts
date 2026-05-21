import type { TagEntityType } from '@/types';
import { createViteval } from '@/sdk';

const viteval = createViteval();

const VALID_ENTITY_TYPES: readonly TagEntityType[] = [
  'eval_run',
  'eval_result',
  'dataset',
  'dataset_item',
] as const;

function parseEntityType(value: string | null): TagEntityType | null {
  if (!value) {
    return null;
  }
  return VALID_ENTITY_TYPES.includes(value as TagEntityType)
    ? (value as TagEntityType)
    : null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    tagId?: string;
    entityType?: string;
    entityId?: string;
  };

  const entityType = parseEntityType(body.entityType ?? null);
  if (!body.tagId || !entityType || !body.entityId) {
    return Response.json(
      { error: 'tagId, entityType, and entityId are required' },
      { status: 400 }
    );
  }

  const result = await viteval.tags.addTagging({
    entityId: body.entityId,
    entityType,
    tagId: body.tagId,
  });

  return Response.json(result);
}

export async function DELETE(request: Request) {
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

  await viteval.tags.removeTagging({ entityId, entityType, tagId });
  return Response.json({ data: null });
}
