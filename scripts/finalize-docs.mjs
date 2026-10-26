import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../.ciderpress/dist');
// GitHub Pages needs directory indexes for trailing-slash links and old URLs.
const pages = (await readdir(root, { recursive: true })).filter(
  (filename) =>
    filename.endsWith('.html') &&
    !['index.html', '404.html'].includes(path.basename(filename))
);
for (const filename of pages) {
  const directory = path.join(root, filename.slice(0, -'.html'.length));
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, 'index.html'),
    await readFile(path.join(root, filename))
  );
}
const routes = [
  '/',
  '/features',
  '/brand',
  '/guide/getting-started',
  '/guide/concepts',
  '/guide/cli',
  '/guide/providers',
  '/guide/migration',
  '/guide/advanced/ci',
  '/guide/advanced/reporters',
  '/api/configuration',
  '/api/evaluate',
  '/api/define-dataset',
  '/api/create-scorer',
  '/api/scorers',
  '/examples',
];
const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
const llms = await readFile(path.join(root, 'llms.txt'), 'utf8');
for (const route of routes) {
  const filename = route === '/' ? 'index.html' : `${route.slice(1)}.html`;
  const html = await readFile(path.join(root, filename), 'utf8');
  assert.match(html, /Viteval/, `Missing rendered content: ${route}`);
  assert.match(html, /<h1[\s>]/, `Missing prerendered heading: ${route}`);
  assert.match(html, /rel="canonical"/, `Missing canonical URL: ${route}`);
  assert.ok(sitemap.includes(`<loc>https://viteval.dev${route}</loc>`), route);
  if (route !== '/') {
    assert.equal(
      await readFile(path.join(root, route.slice(1), 'index.html'), 'utf8'),
      html,
      `Missing trailing-slash alias: ${route}`
    );
    assert.ok(llms.includes(`https://viteval.dev${route}.md`), route);
  }
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const url = new URL(
      match[1].replaceAll('&amp;', '&'),
      `https://viteval.dev${route}`
    );
    if (url.origin !== 'https://viteval.dev') continue;
    const localPath =
      decodeURIComponent(url.pathname).replace(/\/$/, '') || '/';
    const candidates = [
      localPath,
      `${localPath}.html`,
      `${localPath}/index.html`,
    ];
    const found = await Promise.all(
      candidates.map(async (candidate) => {
        try {
          return (await stat(path.join(root, candidate))).isFile();
        } catch {
          return false;
        }
      })
    );
    assert.ok(
      found.some(Boolean),
      `${route}: missing link or asset ${localPath}`
    );
  }
}

for (const filename of [
  'llms-full.txt',
  '404.html',
  'favicon.ico',
  'assets/viteval.png',
  'examples/index.html',
]) {
  assert.ok((await stat(path.join(root, filename))).size > 0, filename);
}

process.stdout.write(
  `Documentation passed: ${routes.length} routes, local links/assets, canonical URLs, sitemap, and LLM output.\n`
);
