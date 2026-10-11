import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Tag, TagEntityType } from '@/types';

interface TagsState {
  allTags: Tag[];
  tagsByEntity: Record<string, Tag[]>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to load and mutate tags + taggings for a set of entities of the same type.
 *
 * @param entityType - The kind of entity being tagged.
 * @param entityIds - Stable list of entity IDs to load taggings for.
 */
export function useTags(entityType: TagEntityType, entityIds: string[]) {
  const idsKey = useMemo(
    () => JSON.stringify([...entityIds].sort()),
    [entityIds]
  );

  const [state, setState] = useState<TagsState>({
    allTags: [],
    error: null,
    loading: true,
    tagsByEntity: {},
  });

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const ids: string[] = JSON.parse(idsKey);
      const [tagsResponse, lookupResponse] = await Promise.all([
        fetch('/api/tags'),
        ids.length > 0
          ? fetch('/api/taggings/lookup', {
              body: JSON.stringify({ entityIds: ids, entityType }),
              headers: { 'Content-Type': 'application/json' },
              method: 'POST',
            })
          : Promise.resolve(null),
      ]);
      if (!tagsResponse.ok || (lookupResponse && !lookupResponse.ok)) {
        throw new Error('Failed to load tags');
      }
      const tagsRes = await tagsResponse.json();
      const lookupRes = lookupResponse
        ? await lookupResponse.json()
        : { data: {} };
      const issue = tagsRes.error ?? lookupRes.error ?? tagsRes.warnings?.[0];
      if (issue) throw new Error(`Failed to load tags: ${String(issue)}`);

      setState({
        allTags: (tagsRes.data ?? []) as Tag[],
        error: null,
        loading: false,
        tagsByEntity: (lookupRes.data ?? {}) as Record<string, Tag[]>,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : 'Failed to load tags',
        loading: false,
      }));
    }
  }, [entityType, idsKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createTag = useCallback(async (name: string): Promise<Tag | null> => {
    const res = await fetch('/api/tags', {
      body: JSON.stringify({ name }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    if (!res.ok) {
      setState((state) => ({ ...state, error: 'Failed to create tag' }));
      return null;
    }
    const { data } = (await res.json()) as { data: Tag };
    setState((s) => ({
      ...s,
      error: null,
      allTags: s.allTags.some((t) => t.id === data.id)
        ? s.allTags
        : [...s.allTags, data].sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return data;
  }, []);

  const addTagging = useCallback(
    async (tagId: string, type: TagEntityType, entityId: string) => {
      const response = await fetch('/api/taggings', {
        body: JSON.stringify({ entityId, entityType: type, tagId }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      if (!response.ok) {
        setState((state) => ({ ...state, error: 'Failed to add tagging' }));
        return;
      }
      setState((s) => {
        const tag = s.allTags.find((t) => t.id === tagId);
        if (!tag) {
          return s;
        }
        const existing = s.tagsByEntity[entityId] ?? [];
        if (existing.some((t) => t.id === tagId)) {
          return s;
        }
        return {
          ...s,
          tagsByEntity: {
            ...s.tagsByEntity,
            [entityId]: [...existing, tag],
          },
        };
      });
    },
    []
  );

  const removeTagging = useCallback(
    async (tagId: string, type: TagEntityType, entityId: string) => {
      const params = new URLSearchParams({
        entityId,
        entityType: type,
        tagId,
      });
      const response = await fetch(`/api/taggings?${params.toString()}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        setState((state) => ({ ...state, error: 'Failed to remove tagging' }));
        return;
      }
      setState((s) => ({
        ...s,
        tagsByEntity: {
          ...s.tagsByEntity,
          [entityId]: (s.tagsByEntity[entityId] ?? []).filter(
            (t) => t.id !== tagId
          ),
        },
      }));
    },
    []
  );

  return {
    addTagging,
    allTags: state.allTags,
    createTag,
    error: state.error,
    loading: state.loading,
    reload,
    removeTagging,
    tagsByEntity: state.tagsByEntity,
  };
}
