import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createJsonProvider } from '@viteval/core/provider';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createViteval } from '@/sdk';

import { GET as listDatasets } from './api-datasets';
import { GET as getResult } from './api-result';
import { GET as listResults } from './api-results';
import { GET as listSuites } from './api-suites';
import { DELETE as deleteTag, PATCH as updateTag } from './api-tag';
import { DELETE as removeTagging, POST as addTagging } from './api-taggings';
import { POST as lookupTaggings } from './api-taggings-lookup';
import { GET as listTags, POST as createTag } from './api-tags';
import { toSerializable } from './serializable';
import { writeListingFixtures } from '@/sdk/test-fixtures';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'viteval-ui-api-'));
  vi.stubEnv('VITEVAL_ROOT_PATH', root);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(root, { recursive: true, force: true });
});

describe('UI HTTP API', () => {
  it('should expose filtered totals and ordering beyond the first server page', async () => {
    await writeListingFixtures(root);
    const datasets = await listDatasets(
      new Request('http://localhost/api/datasets?q=unique%20remote&limit=1')
    );
    expect(await datasets.json()).toMatchObject({
      total: 1,
      data: [{ id: 'dataset-24' }],
    });
    const results = await listResults(
      new Request(
        'http://localhost/api/results?status=failed&sort=name&order=asc&page=2&limit=2'
      )
    );
    expect(await results.json()).toMatchObject({
      total: 12,
      page: 2,
      limit: 2,
      data: [{ id: 'run-5' }, { id: 'run-7' }],
    });
    const suites = await listSuites(
      new Request('http://localhost/api/suites?q=Eval%2024&status=running')
    );
    expect(await suites.json()).toMatchObject({
      total: 1,
      data: [{ name: 'Eval 24' }],
    });
  });

  it('should preserve omitted PATCH fields and validate only supplied values', async () => {
    const created = await createTag(
      jsonRequest('/api/tags', {
        name: 'original',
        color: '#123456',
        description: 'retain me',
      })
    );
    const { data: tag } = await created.json();
    const params = { params: { id: tag.id } };
    const renamed = await updateTag(
      jsonRequest('/api/tags/id', { name: 'renamed' }),
      params
    );
    expect(renamed.status).toBe(200);
    expect(await renamed.json()).toMatchObject({
      data: { name: 'renamed', color: '#123456', description: 'retain me' },
    });
    const recolored = await updateTag(
      jsonRequest('/api/tags/id', { color: '#abcdef' }),
      params
    );
    expect(recolored.status).toBe(200);
    expect(await recolored.json()).toMatchObject({
      data: { name: 'renamed', color: '#abcdef', description: 'retain me' },
    });
    for (const body of [{ name: '' }, { name: null }, { color: 123 }, null]) {
      expect(
        (await updateTag(jsonRequest('/api/tags/id', body), params)).status
      ).toBe(400);
    }
    expect(
      (
        await updateTag(
          new Request('http://localhost/api/tags/id', {
            method: 'PATCH',
            body: '{broken',
          }),
          params
        )
      ).status
    ).toBe(400);
    expect(await createViteval().tags.list()).toMatchObject({
      data: [{ name: 'renamed', color: '#abcdef', description: 'retain me' }],
    });
  });
  it('should return encoded dataset IDs and pagination', async () => {
    const provider = createJsonProvider({ root });
    const created = await provider.datasets!.create({
      name: 'questions/first,release',
      items: [{ input: 'question', expected: 'answer' }],
    });
    if (!created.ok) {
      throw created.error;
    }
    const response = await listDatasets(
      new Request('http://localhost/api/datasets?page=1&limit=5')
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: [{ id: created.value.id, name: 'questions/first,release' }],
      page: 1,
      limit: 5,
      total: 1,
      hasMore: false,
    });
    const detail = await createViteval().datasets.get({ id: created.value.id });
    expect(toSerializable(detail)).toMatchObject({
      data: {
        id: created.value.id,
        data: [{ input: 'question', expected: 'answer' }],
      },
    });
  });

  it('should preserve missing and invalid result responses', async () => {
    const request = new Request('http://localhost/api/results/missing');
    const missing = await getResult(request, { params: { id: 'missing' } });
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: 'Not found' });
    await mkdir(path.join(root, '.viteval/results'), { recursive: true });
    await writeFile(path.join(root, '.viteval/results/broken.json'), '{broken');
    const broken = await getResult(request, { params: { id: 'broken' } });
    expect(broken.status).toBe(500);
    expect(await broken.json()).toEqual({
      error: 'Invalid evaluation result file: broken',
    });
    const listed = await listResults(
      new Request('http://localhost/api/results?status=finished&suite=missing')
    );
    expect(await listed.json()).toMatchObject({
      data: [],
      warnings: ['Invalid result file: broken.json'],
    });
    const suites = await listSuites(
      new Request('http://localhost/api/suites?status=passed')
    );
    expect(await suites.json()).toMatchObject({ data: [], total: 0 });
  });

  it('should preserve tags and tagging lookup', async () => {
    const created = await createTag(
      jsonRequest('/api/tags', { name: 'release', color: '#123456' })
    );
    expect(created.status).toBe(200);
    const tag: { data: { id: string } } = await created.json();
    const tagging = {
      tagId: tag.data.id,
      entityType: 'dataset',
      entityId: 'questions/first,release',
    };
    const added = await addTagging(jsonRequest('/api/taggings', tagging));
    expect(added.status).toBe(200);
    const query = new URLSearchParams({
      entityType: tagging.entityType,
      entityId: tagging.entityId,
    });
    const listed = await listTags(
      new Request(`http://localhost/api/tags?${query}`)
    );
    expect(await listed.json()).toMatchObject({
      data: [{ id: tag.data.id, name: 'release' }],
    });
    const lookup = await lookupTaggings(
      jsonRequest('/api/taggings/lookup', {
        entityType: tagging.entityType,
        entityIds: [tagging.entityId, 'missing'],
      })
    );
    expect(await lookup.json()).toMatchObject({
      data: { [tagging.entityId]: [{ id: tag.data.id }], missing: [] },
    });
    const updated = await updateTag(
      jsonRequest('/api/tags/id', { name: 'updated' }),
      { params: { id: tag.data.id } }
    );
    expect(await updated.json()).toMatchObject({
      data: { id: tag.data.id, name: 'updated' },
    });
    const removalQuery = new URLSearchParams(tagging);
    expect(
      (
        await removeTagging(
          new Request(`http://localhost/api/taggings?${removalQuery}`)
        )
      ).status
    ).toBe(200);
    expect(
      (
        await deleteTag(new Request('http://localhost/api/tags/id'), {
          params: { id: tag.data.id },
        })
      ).status
    ).toBe(200);
  });

  it('should preserve validation and missing-tag errors', async () => {
    const missingName = await createTag(jsonRequest('/api/tags', {}));
    expect(missingName.status).toBe(400);
    expect(await missingName.json()).toEqual({ error: 'name is required' });
    const invalidTagging = await addTagging(
      jsonRequest('/api/taggings', {
        tagId: 'tag',
        entityType: 'invalid',
        entityId: 'item',
      })
    );
    expect(invalidTagging.status).toBe(400);
    expect(await invalidTagging.json()).toEqual({
      error: 'tagId, entityType, and entityId are required',
    });
    const invalidRemoval = await removeTagging(
      new Request('http://localhost/api/taggings')
    );
    expect(invalidRemoval.status).toBe(400);
    const invalidLookup = await lookupTaggings(
      jsonRequest('/api/taggings/lookup', {})
    );
    expect(invalidLookup.status).toBe(400);
    expect(await invalidLookup.json()).toEqual({
      error: 'entityType and entityIds[] are required',
    });
    const missingTag = await updateTag(
      jsonRequest('/api/tags/missing', { name: 'updated' }),
      { params: { id: 'missing' } }
    );
    expect(missingTag.status).toBe(404);
    expect(await missingTag.json()).toEqual({
      error: 'Tag not found: missing',
    });
  });
});

function jsonRequest(url: string, body: unknown): Request {
  return new Request(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
