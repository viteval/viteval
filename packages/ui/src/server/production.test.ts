import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createVitevalServer } from '../../server';
import { reportFixture, writeListingFixtures } from '@/sdk/test-fixtures';
import { suiteId } from '@/lib/suite-id';

describe('production dashboard regressions', () => {
  it('should preserve pagination, suite identities, errors, assets, and isolated server roots through HTTP and SSR', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'viteval-ui-production-'));
    const emptyRoot = await mkdtemp(
      path.join(tmpdir(), 'viteval-ui-production-empty-')
    );
    const server = createVitevalServer({ root });
    const emptyServer = createVitevalServer({ root: emptyRoot });
    try {
      await writeListingFixtures(root);
      const historySuite = {
        name: 'history',
        projectName: 'gpt-4',
        filepath: 'src/accuracy.eval.ts',
      };
      const otherSuite = { ...historySuite, projectName: 'gpt_4' };
      for (let index = 0; index < 25; index++) {
        await writeFile(
          path.join(root, '.viteval/results', `history-${index}.json`),
          JSON.stringify(
            reportFixture({
              id: `history-${index}`,
              index,
              suites: [historySuite],
            })
          )
        );
      }
      await writeFile(
        path.join(root, '.viteval/results/other.json'),
        JSON.stringify(reportFixture({ id: 'other', suites: [otherSuite] }))
      );
      await writeFile(
        path.join(root, '.viteval/datasets/broken.json'),
        '{broken'
      );
      await writeFile(
        path.join(root, '.viteval/datasets/invalid.json'),
        '{"data":"invalid"}'
      );
      await mkdir(path.join(root, '.viteval/datasets/unreadable.json'));
      const encodedId = 'folder/data %?#';
      await writeFile(
        path.join(
          root,
          '.viteval/datasets',
          `${encodeURIComponent(encodedId)}.json`
        ),
        JSON.stringify({
          schemaVersion: 1,
          id: encodedId,
          name: 'Encoded dataset',
          version: 1,
          metadata: {},
          createdAt: '2026-10-01T00:00:00.000Z',
          updatedAt: '2026-10-01T00:00:00.000Z',
          data: [{ input: 'question', expected: null }],
        })
      );
      const port = await server.start();
      const emptyPort = await emptyServer.start();
      const url = `http://localhost:${port}`;
      const emptyUrl = `http://localhost:${emptyPort}`;

      const json = async (pathname: string) => {
        const response = await fetch(`${url}${pathname}`);
        expect(response.status).toBe(200);
        return response.json();
      };
      const html = async (pathname: string, status = 200) => {
        const response = await fetch(`${url}${pathname}`);
        expect(response.status, pathname).toBe(status);
        const body = await response.text();
        return body
          .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, '');
      };

      expect(await json('/api/datasets?page=2')).toMatchObject({
        page: 2,
        limit: 20,
        total: 26,
        hasMore: false,
      });
      expect(await json('/api/datasets?q=unique%20remote')).toMatchObject({
        total: 1,
        data: [{ id: 'dataset-24' }],
      });
      expect(await html('/datasets?page=2')).toContain('Dataset 20');
      expect(await html('/datasets?q=unique%20remote')).toContain('1 row(s)');
      expect(
        await html('/datasets?sort=itemCount&order=desc&limit=1')
      ).toContain('Dataset 24');
      expect(await html('/results?page=2&limit=50')).toContain('Run 00');
      expect(await html('/results?status=failed&limit=50')).not.toContain(
        'Run 00'
      );
      expect(await html('/suites?page=2')).toContain('Eval 20');
      expect(
        await html(`/datasets/${encodeURIComponent(encodedId)}`)
      ).toContain('Encoded dataset');

      const historyPath = `/suites/${encodeURIComponent(suiteId(historySuite))}`;
      expect(await html(`${historyPath}?page=2`)).toContain('Run 00');
      const historyQuery = new URLSearchParams({
        suiteId: suiteId(historySuite),
        page: '2',
      });
      expect(await json(`/api/results?${historyQuery}`)).toMatchObject({
        total: 25,
        page: 2,
        data: [
          { id: 'history-4' },
          { id: 'history-3' },
          { id: 'history-2' },
          { id: 'history-1' },
          { id: 'history-0' },
        ],
      });
      expect(
        await html(`/suites/${encodeURIComponent(suiteId(otherSuite))}`)
      ).toContain('history [gpt_4]');
      await html('/suites/history-gpt-4', 404);
      const suites = await json('/api/suites');
      expect(
        new Set(suites.data.map((suite: { slug: string }) => suite.slug)).size
      ).toBe(suites.data.length);
      const detail = await fetch(`${url}/results/other`);
      expect(detail.status).toBe(200);
      const detailHtml = await detail.text();
      const viewEvalHref = [...detailHtml.matchAll(/href="([^"]+)"/g)]
        .map((match) => match[1].replaceAll('&amp;', '&'))
        .find((href) => href.startsWith('/suites/'));
      expect(decodeURIComponent(viewEvalHref!.slice('/suites/'.length))).toBe(
        suiteId(otherSuite)
      );

      for (const id of ['broken', 'invalid', 'unreadable']) {
        expect(await html(`/datasets/${id}`, 500)).toMatch(/dataset file/i);
      }
      await html('/datasets/missing', 404);

      const tagResponse = await fetch(`${url}/api/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'original',
          color: '#123456',
          description: 'retain',
        }),
      });
      expect(tagResponse.status).toBe(200);
      const { data: tag } = await tagResponse.json();
      for (const update of [{ name: 'renamed' }, { color: '#abcdef' }]) {
        const response = await fetch(`${url}/api/tags/${tag.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        });
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({
          data: {
            name: 'renamed',
            color: 'color' in update ? '#abcdef' : '#123456',
            description: 'retain',
          },
        });
      }
      expect(
        (
          await fetch(`${url}/api/tags/${tag.id}`, {
            method: 'PATCH',
            body: '{broken',
          })
        ).status
      ).toBe(400);

      const emptyListing = await fetch(`${emptyUrl}/api/datasets`);
      expect(await emptyListing.json()).toMatchObject({ total: 0, data: [] });
      const emptyPage = await fetch(`${emptyUrl}/datasets`);
      expect((await emptyPage.text()).replace(/<[^>]+>/g, '')).toContain(
        '0 row(s)'
      );
      expect(await json('/api/datasets')).toMatchObject({ total: 26 });

      const page = await fetch(`${url}/datasets`);
      const pageHtml = await page.text();
      const stylesheet = /href="([^"<>]*\/assets\/[^"<>]+\.css)"/.exec(
        pageHtml
      )?.[1];
      expect(stylesheet).toBeDefined();
      const cssResponse = await fetch(new URL(stylesheet!, url));
      expect(cssResponse.status).toBe(200);
      const css = await cssResponse.text();
      const fonts = [
        ...css.matchAll(/url\(["']?([^\s)"']+\.woff2)["']?\)/g),
      ].map((match) => match[1]);
      expect(fonts.length).toBeGreaterThanOrEqual(2);
      for (const font of fonts) {
        const response = await fetch(new URL(font, cssResponse.url));
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toMatch(/font|woff/);
      }
      await server.shutdown();
      await server.waitForExit();
      await emptyServer.shutdown();
      await emptyServer.waitForExit();
    } finally {
      await Promise.all([server.shutdown(), emptyServer.shutdown()]);
      await Promise.all([
        rm(root, { recursive: true, force: true }),
        rm(emptyRoot, { recursive: true, force: true }),
      ]);
    }
  }, 30_000);
});
