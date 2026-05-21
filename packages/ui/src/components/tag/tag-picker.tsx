'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PlusIcon, TagIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Tag } from '@/types';

interface TagPickerProps {
  allTags: Tag[];
  selectedTagIds: Set<string>;
  onToggle: (tag: Tag) => void;
  onCreate: (name: string) => Promise<Tag | null>;
  trigger?: React.ReactNode;
}

export function TagPicker({
  allTags,
  selectedTagIds,
  onToggle,
  onCreate,
  trigger,
}: TagPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return allTags;
    }
    return allTags.filter((t) => t.name.toLowerCase().includes(q));
  }, [allTags, query]);

  const exactMatch = useMemo(
    () =>
      allTags.find((t) => t.name.toLowerCase() === query.trim().toLowerCase()),
    [allTags, query]
  );

  const canCreate = query.trim().length > 0 && !exactMatch;

  async function handleCreate() {
    if (!canCreate || creating) {
      return;
    }
    setCreating(true);
    try {
      const tag = await onCreate(query.trim());
      if (tag) {
        onToggle(tag);
      }
      setQuery('');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1">
            <TagIcon className="h-3 w-3" />
            Tag
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canCreate) {
              e.preventDefault();
              void handleCreate();
            }
          }}
          placeholder="Search or create tag..."
          className="h-8 text-sm"
        />
        <div className="mt-2 max-h-60 overflow-y-auto">
          {filtered.length === 0 && !canCreate && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              No tags yet
            </div>
          )}
          {filtered.map((tag) => {
            const selected = selectedTagIds.has(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => onToggle(tag)}
                className={cn(
                  'w-full text-left px-2 py-1.5 rounded text-xs hover:bg-accent flex items-center gap-2',
                  selected && 'bg-accent/50'
                )}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full border"
                  style={
                    tag.color
                      ? { backgroundColor: tag.color, borderColor: tag.color }
                      : undefined
                  }
                />
                <span className="flex-1">{tag.name}</span>
                {selected && <span className="text-muted-foreground">✓</span>}
              </button>
            );
          })}
          {canCreate && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-accent flex items-center gap-2 text-muted-foreground"
            >
              <PlusIcon className="h-3 w-3" />
              Create &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
