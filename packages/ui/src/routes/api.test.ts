import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { writeListingFixtures } from '@/sdk/test-fixtures';
import { Route as datasets } from './api.datasets';
import { Route as results } from './api.results.index';
import { Route as result } from './api.results.$id';
import { Route as suites } from './api.suites';
import { Route as tags } from './api.tags.index';
import { Route as tag } from './api.tags.$id';
import { Route as taggings } from './api.taggings.index';
import { Route as lookup } from './api.taggings.lookup';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'viteval-api-routes-'));
  vi.stubEnv('VITEVAL_ROOT_PATH', root);
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(root, { recursive: true, force: true });
});

async function invoke({
  route,
  method,
  url,
  body,
  params = {},
}: {
  route: { options: object };
  method: string;
  url: string;
  body?: unknown;
  params?: Record<string, string>;
}) {
  const server: unknown = Reflect.get(route.options, 'server');
  if (typeof server !== 'object' || server === null)
    throw new Error('Missing route server config');
  const handlers: unknown = Reflect.get(server, 'handlers');
  if (typeof handlers !== 'object' || handlers === null)
    throw new Error('Missing route handlers');
  const handler: unknown = Reflect.get(handlers, method);
  if (typeof handler !== 'function')
    throw new Error(`Missing ${method} handler`);
  const response: unknown = await Reflect.apply(handler, undefined, [
    {
      request: new Request(`http://localhost${url}`, {
        method,
        ...(body === undefined
          ? {}
          : {
              body: JSON.stringify(body),
              headers: { 'Content-Type': 'application/json' },
            }),
      }),
      params,
    },
  ]);
  if (!(response instanceof Response))
    throw new Error('Route must return a Response');
  return response;
}

describe('file-route HTTP adapters', () => {
  it.each([
    { route: datasets, url: '/api/datasets', id: 'dataset-24' },
    { route: results, url: '/api/results', id: 'run-24' },
    { route: suites, url: '/api/suites', id: undefined },
  ])(
    'should forward listing query parameters at $url',
    async ({ route, url, id }) => {
      await writeListingFixtures(root);
      const response = await invoke({
        route,
        method: 'GET',
        url: `${url}?limit=1&sort=recent`,
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        total: 25,
        limit: 1,
        data: [id ? { id } : { name: 'Eval 00' }],
      });
    }
  );
  it('should pass decoded result IDs and return detail or missing HTTP statuses', async () => {
    await writeListingFixtures(root);
    const response = await invoke({
      route: result,
      method: 'GET',
      url: '/api/results/run-0',
      params: { id: 'run-0' },
    });
    expect(await response.json()).toMatchObject({
      runId: 'run-0',
      schemaVersion: 1,
    });
    expect(
      (
        await invoke({
          route: result,
          method: 'GET',
          url: '/api/results/missing',
          params: { id: 'missing' },
        })
      ).status
    ).toBe(404);
  });
  it('should dispatch each tag and tagging mutation to its actual persisted handler', async () => {
    const created = await invoke({
      route: tags,
      method: 'POST',
      url: '/api/tags',
      body: { name: 'release' },
    });
    const { data: createdTag } = await created.json();
    const id = String(createdTag.id);
    const tagging = {
      tagId: id,
      entityType: 'dataset',
      entityId: 'raw/data?key=1',
    };
    expect(
      (
        await invoke({
          route: taggings,
          method: 'POST',
          url: '/api/taggings',
          body: tagging,
        })
      ).status
    ).toBe(200);
    const lookedUp = await invoke({
      route: lookup,
      method: 'POST',
      url: '/api/taggings/lookup',
      body: { entityType: 'dataset', entityIds: [tagging.entityId] },
    });
    expect(await lookedUp.json()).toMatchObject({
      data: { [tagging.entityId]: [{ id }] },
    });
    const listed = await invoke({
      route: tags,
      method: 'GET',
      url: '/api/tags',
    });
    expect(await listed.json()).toMatchObject({
      data: [{ id, name: 'release' }],
    });
    const patched = await invoke({
      route: tag,
      method: 'PATCH',
      url: `/api/tags/${id}`,
      params: { id },
      body: { description: 'v1 release' },
    });
    expect(await patched.json()).toMatchObject({
      data: { description: 'v1 release' },
    });
    expect(
      (
        await invoke({
          route: taggings,
          method: 'DELETE',
          url: `/api/taggings?${new URLSearchParams(tagging)}`,
        })
      ).status
    ).toBe(200);
    expect(
      (
        await invoke({
          route: tag,
          method: 'DELETE',
          url: `/api/tags/${id}`,
          params: { id },
        })
      ).status
    ).toBe(200);
  });
});
