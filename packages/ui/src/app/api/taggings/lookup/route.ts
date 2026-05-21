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
    entityType?: string;
    entityIds?: string[];
  };

  const entityType = parseEntityType(body.entityType ?? null);
  if (!entityType || !Array.isArray(body.entityIds)) {
    return Response.json(
      { error: 'entityType and entityIds[] are required' },
      { status: 400 }
    );
  }

  const result = await viteval.tags.listTaggingsForEntities(
    entityType,
    body.entityIds
  );

  return Response.json(result);
}
