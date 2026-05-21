'use client';

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
  const idsKey = useMemo(() => [...entityIds].sort().join(','), [entityIds]);

  const [state, setState] = useState<TagsState>({
    allTags: [],
    error: null,
    loading: true,
    tagsByEntity: {},
  });

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const ids = idsKey ? idsKey.split(',') : [];
      const [tagsRes, lookupRes] = await Promise.all([
        fetch('/api/tags').then((r) => r.json()),
        ids.length > 0
          ? fetch('/api/taggings/lookup', {
              body: JSON.stringify({ entityIds: ids, entityType }),
              headers: { 'Content-Type': 'application/json' },
              method: 'POST',
            }).then((r) => r.json())
          : Promise.resolve({ data: {} }),
      ]);

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
      return null;
    }
    const { data } = (await res.json()) as { data: Tag };
    setState((s) => ({
      ...s,
      allTags: s.allTags.some((t) => t.id === data.id)
        ? s.allTags
        : [...s.allTags, data].sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return data;
  }, []);

  const addTagging = useCallback(
    async (tagId: string, type: TagEntityType, entityId: string) => {
      await fetch('/api/taggings', {
        body: JSON.stringify({ entityId, entityType: type, tagId }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
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
      await fetch(`/api/taggings?${params.toString()}`, { method: 'DELETE' });
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
