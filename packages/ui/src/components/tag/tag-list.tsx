'use client';

import { useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Tag, TagEntityType } from '@/types';
import { useTags } from './use-tags';
import { TagChip } from './tag-chip';
import { TagPicker } from './tag-picker';

interface TagListProps {
  entityType: TagEntityType;
  entityId: string;
  className?: string;
  /** When true, hides the add-tag picker (read-only display). */
  readOnly?: boolean;
}

export function TagList({
  entityType,
  entityId,
  className,
  readOnly,
}: TagListProps) {
  const { allTags, tagsByEntity, addTagging, removeTagging, createTag } =
    useTags(entityType, [entityId]);

  const selected = tagsByEntity[entityId] ?? [];
  const selectedIds = useMemo(
    () => new Set(selected.map((t) => t.id)),
    [selected]
  );

  const handleToggle = useCallback(
    (tag: Tag) => {
      if (selectedIds.has(tag.id)) {
        void removeTagging(tag.id, entityType, entityId);
      } else {
        void addTagging(tag.id, entityType, entityId);
      }
    },
    [addTagging, entityId, entityType, removeTagging, selectedIds]
  );

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {selected.map((tag) => (
        <TagChip
          key={tag.id}
          tag={tag}
          onRemove={
            readOnly
              ? undefined
              : () => removeTagging(tag.id, entityType, entityId)
          }
        />
      ))}
      {!readOnly && (
        <TagPicker
          allTags={allTags}
          selectedTagIds={selectedIds}
          onToggle={handleToggle}
          onCreate={createTag}
        />
      )}
    </div>
  );
}
