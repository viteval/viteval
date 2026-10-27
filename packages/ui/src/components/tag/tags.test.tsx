// @vitest-environment jsdom
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/server/api-tags';
import { POST as lookup } from '@/server/api-taggings-lookup';
import { DELETE as remove, POST as add } from '@/server/api-taggings';
import { createViteval } from '@/sdk';
import { TagList } from './tag-list';
import { TagPicker } from './tag-picker';
import { useTags } from './use-tags';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'viteval-tags-interaction-'));
  vi.stubEnv('VITEVAL_ROOT_PATH', root);
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const request = new Request(`http://localhost${input}`, init);
      if (input === '/api/tags')
        return init?.method === 'POST' ? POST(request) : GET(request);
      if (input === '/api/taggings/lookup') return lookup(request);
      return init?.method === 'DELETE' ? remove(request) : add(request);
    })
  );
});
afterEach(async () => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  await rm(root, { recursive: true, force: true });
});

describe('tagging interactions', () => {
  it('should suppress duplicate Enter submissions while a tag creation is pending', async () => {
    let resolveCreate: ((value: null) => void) | undefined;
    const onCreate = vi.fn(
      () =>
        new Promise<null>((resolve) => {
          resolveCreate = resolve;
        })
    );
    render(
      <TagPicker
        allTags={[]}
        selectedTagIds={new Set()}
        onToggle={vi.fn()}
        onCreate={onCreate}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tag' }));
    const input = screen.getByPlaceholderText('Search or create tag...');
    fireEvent.change(input, { target: { value: 'release' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCreate).toHaveBeenCalledOnce();
    await act(async () => resolveCreate?.(null));
    expect(screen.queryByRole('button', { name: /Create/ })).toBeNull();
  });

  it('should retain local state when a successful tagging references a tag created in another client', async () => {
    const { result } = renderHook(() => useTags('dataset', ['data']));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const created = await createViteval().tags.create({ name: 'external' });
    if (!created.data) throw new Error('Tag fixture failed');
    const id = created.data.id;
    await act(async () => {
      await result.current.addTagging(id, 'dataset', 'data');
    });
    expect(result.current.allTags).toEqual([]);
    expect(result.current.tagsByEntity.data).toEqual([]);
    expect(
      (
        await createViteval().tags.listTaggings({
          entityType: 'dataset',
          entityId: 'data',
        })
      ).data
    ).toHaveLength(1);
  });
  it('should create, assign, unassign and remove tags through HTTP handlers and persisted storage', async () => {
    render(<TagList entityType="dataset" entityId="folder/data?release=1" />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole('button', { name: 'Tag' }));
    expect(await screen.findByText('No tags yet')).toBeTruthy();
    const input = screen.getByPlaceholderText('Search or create tag...');
    fireEvent.change(input, { target: { value: ' release ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    const removal = await screen.findByRole('button', {
      name: 'Remove tag release',
    });
    expect(
      (
        await createViteval().tags.listTaggings({
          entityType: 'dataset',
          entityId: 'folder/data?release=1',
        })
      ).data
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /release.*✓/ }));
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Remove tag release' })
      ).toBeNull()
    );
    fireEvent.click(screen.getByRole('button', { name: 'release' }));
    await screen.findByRole('button', { name: 'Remove tag release' });
    fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.click(
      removal.isConnected
        ? removal
        : screen.getByRole('button', { name: 'Remove tag release' })
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Remove tag release' })
      ).toBeNull()
    );
    expect(
      (
        await createViteval().tags.listTaggings({
          entityType: 'dataset',
          entityId: 'folder/data?release=1',
        })
      ).data
    ).toEqual([]);
  });
  it('should display assigned colored tags without mutation controls in read-only mode', async () => {
    const sdk = createViteval();
    const created = await sdk.tags.create({
      name: 'important',
      color: '#123456',
    });
    if (!created.data) throw new Error('Tag fixture failed');
    await sdk.tags.addTagging({
      tagId: created.data.id,
      entityId: 'run',
      entityType: 'eval_run',
    });
    render(<TagList entityType="eval_run" entityId="run" readOnly />);
    expect(await screen.findByText('important')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('should filter case-insensitively, avoid duplicate names, and recover from a declined creation', async () => {
    const onCreate = vi.fn().mockResolvedValue(null);
    const onToggle = vi.fn();
    render(
      <TagPicker
        allTags={[
          { id: 'one', name: 'Release', createdAt: '2026-10-01T00:00:00.000Z' },
          {
            id: 'two',
            name: 'Other',
            color: '#ffffff',
            createdAt: '2026-10-01T00:00:00.000Z',
          },
        ]}
        selectedTagIds={new Set(['one'])}
        onToggle={onToggle}
        onCreate={onCreate}
        trigger={<button type="button">Choose tags</button>}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Choose tags' }));
    const input = screen.getByPlaceholderText('Search or create tag...');
    fireEvent.change(input, { target: { value: 'release' } });
    expect(screen.queryByRole('button', { name: /Create/ })).toBeNull();
    expect(screen.queryByText('Other')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Release/ }));
    expect(onToggle).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'one' })
    );
    fireEvent.change(input, { target: { value: 'new' } });
    fireEvent.click(screen.getByRole('button', { name: /Create/ }));
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(''));
    expect(onCreate).toHaveBeenCalledWith('new');
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
  it('should display load errors without offering stale assigned tags', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({}, { status: 500 }));
    render(<TagList entityType="dataset" entityId="broken" />);
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Failed to load tags'
    );
  });
});

describe('useTags mutation and error recovery', () => {
  it('should keep assignment idempotent, ignore unknown tags, and reload persisted state', async () => {
    const { result } = renderHook(() => useTags('dataset', []));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetch).toHaveBeenCalledTimes(1);
    let tagId = '';
    await act(async () => {
      tagId = (await result.current.createTag('zeta'))!.id;
    });
    await act(async () => {
      await result.current.createTag('alpha');
      await result.current.createTag('zeta');
    });
    expect(result.current.allTags.map((tag) => tag.name)).toEqual([
      'alpha',
      'zeta',
    ]);
    await act(async () => {
      await result.current.addTagging(tagId, 'dataset', 'data');
      await result.current.addTagging(tagId, 'dataset', 'data');
    });
    expect(result.current.tagsByEntity.data).toHaveLength(1);
    await act(async () =>
      result.current.addTagging('unknown', 'dataset', 'data')
    );
    expect(result.current.tagsByEntity.data).toHaveLength(1);
    await act(async () =>
      result.current.removeTagging(tagId, 'dataset', 'missing')
    );
    await act(async () =>
      result.current.removeTagging(tagId, 'dataset', 'data')
    );
    expect(result.current.tagsByEntity.data).toEqual([]);
    await act(async () => result.current.reload());
    expect(result.current.error).toBeNull();
  });
  it.each([
    {
      body: { error: 'storage unavailable' },
      message: 'Failed to load tags: storage unavailable',
    },
    {
      body: { warnings: ['corrupt tags'] },
      message: 'Failed to load tags: corrupt tags',
    },
    { body: {}, message: null },
  ])(
    'should preserve API warnings and missing response defaults',
    async ({ body, message }) => {
      vi.mocked(fetch).mockImplementation(async () => Response.json(body));
      const { result } = renderHook(() => useTags('dataset', ['data']));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe(message);
      expect(result.current.allTags).toEqual([]);
      expect(result.current.tagsByEntity).toEqual({});
    }
  );
  it('should preserve non-Error network failures as a safe user-facing message', async () => {
    vi.mocked(fetch).mockRejectedValue('offline');
    const { result } = renderHook(() => useTags('dataset', []));
    await waitFor(() =>
      expect(result.current.error).toBe('Failed to load tags')
    );
  });
  it('should report each failed mutation without changing assignments', async () => {
    const { result } = renderHook(() => useTags('dataset', []));
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.mocked(fetch).mockImplementation(async () =>
      Response.json({}, { status: 500 })
    );
    await act(async () =>
      expect(result.current.createTag('failed')).resolves.toBeNull()
    );
    expect(result.current.error).toBe('Failed to create tag');
    await act(async () => result.current.addTagging('tag', 'dataset', 'data'));
    expect(result.current.error).toBe('Failed to add tagging');
    await act(async () =>
      result.current.removeTagging('tag', 'dataset', 'data')
    );
    expect(result.current.error).toBe('Failed to remove tagging');
    expect(result.current.tagsByEntity).toEqual({});
  });
});
