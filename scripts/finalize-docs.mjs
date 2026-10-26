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
const landing = await readFile(path.join(root, 'index.html'), 'utf8');
assert.doesNotMatch(landing, /class="cp-header-icon"/);
assert.ok(landing.includes('/assets/viteval-wordmark.svg'));
assert.ok(landing.includes('/viteval-flask.svg'));
assert.ok(landing.includes('/icon.svg'));
assert.ok(landing.includes('knowledge.eval.ts'));
assert.ok(landing.includes('answerCorrectness'));
assert.doesNotMatch(landing, /vv-workflow__line-number|A named.*defineDataset/);
const brand = await readFile(path.join(root, 'brand.html'), 'utf8');
for (const asset of [
  'viteval-wordmark.svg',
  'viteval-wordmark-light.svg',
  'viteval-flask.svg',
  'viteval-loading.svg',
]) {
  assert.ok(
    brand.includes(`/assets/${asset}`),
    `Missing brand asset preview: ${asset}`
  );
  assert.match(brand, /download=""/);
}
assert.ok(brand.includes('Pause preview'));
for (const asset of [
  'viteval-wordmark.svg',
  'viteval-wordmark-light.svg',
  'viteval-flask.svg',
  'viteval-loading.svg',
]) {
  const svg = await readFile(path.join(root, 'assets', asset), 'utf8');
  assert.doesNotMatch(
    svg,
    /<image\b|<text\b|data:image|font-family/i,
    `Brand artwork must be standalone paths: ${asset}`
  );
  assert.match(svg, /#168DFA/i);
  assert.match(svg, /#12D9E9/i);
}
const loadingIcon = await readFile(
  path.join(root, 'assets/viteval-loading.svg'),
  'utf8'
);
assert.match(loadingIcon, /infinite/);
assert.match(loadingIcon, /prefers-reduced-motion/);
assert.match(loadingIcon, /clip-path/);
assert.doesNotMatch(landing, /<landingpage\b|import \{ LandingPage \}/i);
assert.equal(
  [...landing.matchAll(/class="vv-feature"/g)].length,
  4,
  'The custom MDX homepage must prerender all four feature panels'
);
assert.doesNotMatch(landing, /Pause animations|Play animations/);
assert.ok(
  landing.includes('Replay example evaluation animation'),
  'Missing hero replay control'
);
assert.ok(
  landing.includes('vv-hero-terminal__bar'),
  'Missing framed hero terminal'
);
assert.equal(
  [...landing.matchAll(/class="vv-hero-terminal__result"/g)].length,
  3
);
assert.ok(
  landing.includes('vv-hero-terminal__summary'),
  'Missing hero run summary'
);
for (const scene of ['tooling', 'scores', 'local', 'runners']) {
  assert.ok(
    landing.includes(`vv-scene--${scene}`),
    `Missing custom feature scene: ${scene}`
  );
}
assert.doesNotMatch(landing, /src="\/assets\/feature-[^"]+\.svg"/);
assert.doesNotMatch(
  landing,
  /<article class="vv-feature"[^>]*data-visible="false"/
);
const stylesheets = (await readdir(root, { recursive: true })).filter(
  (filename) => filename.endsWith('.css')
);
const styles = (
  await Promise.all(
    stylesheets.map((filename) => readFile(path.join(root, filename), 'utf8'))
  )
).join('\n');
assert.doesNotMatch(styles, /img\.shields\.io/);
assert.ok(styles.includes('vv-star-nudge'));
const styleRules = [...styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
for (const provider of [
  'Braintrust',
  'Langfuse',
  'VoltOps',
  'SQLite',
  'Amazon S3',
  'Google Cloud Storage',
]) {
  assert.ok(
    styleRules.some(
      ([, selectors, declarations]) =>
        selectors.replaceAll('\\ ', ' ').includes(provider) &&
        selectors.includes('aria-label') &&
        declarations.includes('--provider-name:')
    ),
    `Tooltip must support masked and image logos: ${provider}`
  );
}
for (const selector of [
  '.vv-stack__layer--top',
  '.vv-score__track span',
  '.vv-terminal-line',
  '.vv-runner-map__beams',
]) {
  assert.ok(
    styleRules.some(
      ([, selectors, declarations]) =>
        selectors.includes(selector) &&
        /animation:[^;}]*\binfinite\b/.test(declarations)
    ),
    `Feature animation must loop in the production CSS: ${selector}`
  );
}
for (const step of ['write', 'run', 'inspect']) {
  assert.ok(
    landing.includes(`id="vv-workflow-step-${step}"`),
    `Missing workflow control: ${step}`
  );
  assert.ok(
    landing.includes(`id="vv-workflow-panel-${step}"`),
    `Missing workflow visual: ${step}`
  );
}
assert.doesNotMatch(landing, /class="cp-tabs\b/);
assert.equal(
  [...landing.matchAll(/class="cp-cta__btn\b/g)].length,
  1,
  'The closing CTA must have one action'
);
for (const heading of [
  'Evals belong beside your tests.',
  'Built on Vitest',
  'Useful defaults, built in',
  'Local-first by default',
  'Run on your infrastructure',
  'View all features',
  'Write. Run. Inspect.',
  'Local first. Connected when you need it.',
  'View integrations',
  'Run your first evaluation.',
]) {
  assert.ok(landing.includes(heading), `Missing landing section: ${heading}`);
}

const features = await readFile(path.join(root, 'features.html'), 'utf8');
assert.doesNotMatch(features, /classifyTicket|Ticket routing/);
for (const anchor of [
  'familiar-tooling',
  'built-in-defaults',
  'local-first',
  'run-anywhere',
]) {
  assert.ok(features.includes(`id="${anchor}"`), `Missing feature: ${anchor}`);
  assert.ok(
    landing.includes(`/features#${anchor}`),
    `Missing homepage feature link: ${anchor}`
  );
}

for (const route of routes) {
  const filename = route === '/' ? 'index.html' : `${route.slice(1)}.html`;
  const html = await readFile(path.join(root, filename), 'utf8');
  const footer = html.match(
    /<footer class="cp-site-footer"[\s\S]*?<\/footer>/
  )?.[0];
  assert.ok(footer, `Missing site footer: ${route}`);
  for (const href of [
    '/brand',
    '/api/configuration',
    '/guide/providers',
    'https://github.com/viteval/viteval/blob/main/LICENSE',
  ]) {
    assert.ok(
      footer.includes(`href="${href}"`),
      `Missing footer link ${href}: ${route}`
    );
  }
  assert.ok(footer.includes('/icon.svg'), `Missing footer flask: ${route}`);
  assert.ok(
    html.includes('/github-stars.js'),
    `Missing live GitHub count script: ${route}`
  );
  assert.ok(
    footer.includes('TypeScript-native evals, powered by Vitest.'),
    `Missing footer catchphrase: ${route}`
  );
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

const gettingStarted = await readFile(
  path.join(root, 'guide/getting-started.md'),
  'utf8'
);
assert.match(gettingStarted, /viteval@rc/);
assert.match(gettingStarted, /vitest\.config\.ts/);
assert.doesNotMatch(llms, /\/v0\//);
process.stdout.write(
  `Documentation passed: ${routes.length} routes, local links/assets, canonical URLs, sitemap, LLM output, and RC installation instructions.\n`
);
