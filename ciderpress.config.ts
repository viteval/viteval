import { BUILT_IN_THEMES, defineTheme } from '@ciderpress/theme';
import { defineConfig } from 'ciderpress';

import pkg from './packages/viteval/package.json' with { type: 'json' };

const midnightDark = BUILT_IN_THEMES.midnight.variants.dark!;
const honeycrispLight = BUILT_IN_THEMES.honeycrisp.variants.light!;
const SITE_HEAD: [string, Record<string, string>][] = [
  ['script', { type: 'module', src: '/github-stars.js' }],
  ['link', { rel: 'stylesheet', href: '/footer.css' }],
  ['link', { rel: 'stylesheet', href: '/loader.css' }],
];
const FONT_FAMILIES = {
  sans: "'Geist', ui-sans-serif, system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, 'SFMono-Regular', monospace",
  display: "'Geist', ui-sans-serif, system-ui, sans-serif",
};

const vitevalTheme = defineTheme({
  name: 'viteval',
  defaultVariant: 'dark',
  variants: {
    dark: {
      ...midnightDark,
      fonts: { ...midnightDark.fonts, family: FONT_FAMILIES },
      colors: {
        ...midnightDark.colors,
        brand: {
          primary: '#168DFA',
          hover: '#47A6FC',
          active: '#0875D9',
          fg: '#0B1016',
          soft: 'rgba(22, 141, 250, 0.12)',
          onBrand: '#0B1016',
          light: '#47A6FC',
          lighter: '#A4D4FE',
        },
        surface: {
          ...midnightDark.colors.surface,
          bg: '#0B1016',
          bgAlt: '#101820',
          bgElv: '#16212C',
          bgSoft: '#1B2835',
          bgIcon: '#243443',
          homeBg: '#0B1016',
          gutter: '#101820',
          codeBlockBg: '#101820',
        },
        text: { text1: '#F8FAFC', text2: '#B6C4D2', text3: '#93A4B6' },
        border: {
          border: '#293644',
          divider: '#1C2935',
          sidebarAltBorderDark: '#374A5C',
        },
        gradient: { heroCyan: '#12D9E9', heroPurple: '#168DFA' },
        button: {
          ...midnightDark.colors.button,
          brand: {
            bg: '#168DFA',
            hoverBg: '#47A6FC',
            activeBg: '#0875D9',
            text: '#0B1016',
          },
        },
      },
    },
    light: {
      ...honeycrispLight,
      fonts: { ...honeycrispLight.fonts, family: FONT_FAMILIES },
      colors: {
        ...honeycrispLight.colors,
        brand: {
          primary: '#086BC1',
          hover: '#075AA3',
          active: '#064A86',
          fg: '#ffffff',
          soft: 'rgba(22, 141, 250, 0.08)',
          onBrand: '#ffffff',
          light: '#086BC1',
          lighter: '#168DFA',
        },
        surface: {
          ...honeycrispLight.colors.surface,
          bg: '#F8FAFC',
          bgAlt: '#f3f3f3',
          bgElv: '#ffffff',
          bgSoft: '#eeeeee',
          bgIcon: '#e5e5e5',
          homeBg: '#F8FAFC',
          gutter: '#f3f3f3',
          codeBlockBg: '#f3f3f3',
        },
        text: { text1: '#171717', text2: '#525252', text3: '#6b6b6b' },
        border: {
          border: '#d4d4d4',
          divider: '#e5e5e5',
          sidebarAltBorderDark: '#b8b8b8',
        },
        gradient: { heroCyan: '#087F8C', heroPurple: '#086BC1' },
        button: {
          ...honeycrispLight.colors.button,
          brand: {
            bg: '#086BC1',
            hoverBg: '#075AA3',
            activeBg: '#064A86',
            text: '#ffffff',
          },
        },
      },
    },
  },
});

export default defineConfig({
  title: 'Viteval',
  description: 'TypeScript-native evals, powered by Vitest.',
  version: `v${pkg.version}`,
  seo: {
    origin: 'https://viteval.dev',
    titleTemplate: '%s | Viteval',
    sitemap: true,
  },
  theme: {
    themes: [vitevalTheme],
    defaultVariant: 'dark',
    variantSwitcher: true,
  },
  brand: {
    logo: '/assets/viteval-wordmark.svg',
    favicon: '/assets/viteval-flask.svg',
    loader: {
      content: '/assets/viteval-loading-wordmark.svg',
      label: '',
    },
  },
  footer: {
    message: 'TypeScript-native evals, powered by Vitest.',
    copyright: true,
    tagline:
      'MIT licensed. Viteval is an independent open-source project. It is not affiliated with, endorsed by, or supported by VoidZero.',
    columns: [
      {
        heading: 'Start here',
        links: [
          { text: 'Introduction', href: '/introduction' },
          { text: 'Why Viteval', href: '/features' },
          { text: 'Getting started', href: '/getting-started' },
          { text: 'Concepts', href: '/concepts/evaluations' },
          { text: 'Examples', href: '/examples' },
        ],
      },
      {
        heading: 'Reference',
        links: [
          { text: 'Configuration', href: '/api/configuration' },
          { text: 'Evaluations', href: '/api/evaluate' },
          { text: 'Datasets', href: '/api/define-dataset' },
          { text: 'Scorers', href: '/api/scoring/scorers' },
        ],
      },
      {
        heading: 'Workflow',
        links: [
          { text: 'CLI', href: '/cli/run' },
          { text: 'Run in CI', href: '/guide/ci' },
          { text: 'Inspect results', href: '/guide/results' },
          { text: 'Providers', href: '/guide/providers' },
        ],
      },
      {
        heading: 'Project',
        links: [
          { text: 'Source code', href: 'https://github.com/viteval/viteval' },
          { text: 'Brand & assets', href: '/brand' },
          {
            text: 'License',
            href: 'https://github.com/viteval/viteval/blob/main/LICENSE',
          },
          { text: 'Migrate to v1', href: '/guide/migration' },
        ],
      },
    ],
  },
  editLink: { repo: 'viteval/viteval', branch: 'main', directory: 'docs' },
  reportLink: { repo: 'viteval/viteval' },
  topbar: {
    announcement: {
      message: 'V1 release candidate available.',
      cta: { href: '/guide/migration', label: 'Migration guide' },
      persistent: true,
    },
    nav: [
      { title: 'Introduction', link: '/introduction' },
      { title: 'Get started', link: '/getting-started' },
      {
        title: 'Concepts',
        activeMatch: '^/concepts(?:/|$)',
        items: [
          { title: 'Evaluations and tasks', link: '/concepts/evaluations' },
          { title: 'Datasets', link: '/concepts/datasets' },
          { title: 'Scoring and thresholds', link: '/concepts/scoring' },
          { title: 'Storage and results', link: '/concepts/storage' },
        ],
      },
      {
        title: 'Guides',
        activeMatch: '^/guide(?:/|$)',
        items: [
          { title: 'Configure models', link: '/guide/models' },
          { title: 'Write a custom scorer', link: '/guide/custom-scorers' },
          { title: 'Set up storage providers', link: '/guide/providers' },
          { title: 'Inspect results', link: '/guide/results' },
          { title: 'Run in CI', link: '/guide/ci' },
          { title: 'Migrate to v1', link: '/guide/migration' },
        ],
      },
      {
        title: 'Reference',
        activeMatch: '^/(?:api|cli)(?:/|$)',
        items: [
          { title: 'API', link: '/api/evaluate', activeMatch: '^/api(?:/|$)' },
          { title: 'CLI', link: '/cli/run', activeMatch: '^/cli(?:/|$)' },
        ],
      },
    ],
    cta: { text: 'GitHub', href: 'https://github.com/viteval/viteval' },
  },
  pages: [
    {
      title: 'Viteval',
      path: '/',
      include: 'docs/index.mdx',
      nav: { hidden: true },
    },
    {
      title: 'Features',
      path: '/features',
      include: 'docs/features.mdx',
      nav: { hidden: true },
    },
    {
      title: 'Brand & assets',
      path: '/brand',
      include: 'docs/brand.mdx',
      nav: { hidden: true },
    },
    {
      title: 'Introduction',
      path: '/introduction',
      include: 'docs/introduction.md',
    },
    {
      title: 'Getting started',
      path: '/getting-started',
      include: 'docs/getting-started.mdx',
    },
    {
      title: 'Concepts',
      path: '/concepts',
      description:
        'Understand evaluation execution, datasets, scoring, and result storage.',
      discover: { sort: 'none' as const },
      pages: [
        {
          title: 'Evaluations and tasks',
          path: '/concepts/evaluations',
          include: 'docs/concepts/evaluations.md',
        },
        {
          title: 'Datasets',
          path: '/concepts/datasets',
          include: 'docs/concepts/datasets.md',
        },
        {
          title: 'Scoring and thresholds',
          path: '/concepts/scoring',
          include: 'docs/concepts/scoring.md',
        },
        {
          title: 'Storage and results',
          path: '/concepts/storage',
          include: 'docs/concepts/storage.md',
        },
      ],
    },
    {
      title: 'Guides',
      path: '/guide',
      description:
        'Configure models and storage, inspect results, and run evaluations in CI.',
      discover: { sort: 'none' as const },
      pages: [
        {
          title: 'Configure models',
          path: '/guide/models',
          include: 'docs/guide/models.mdx',
        },
        {
          title: 'Write a custom scorer',
          path: '/guide/custom-scorers',
          include: 'docs/guide/custom-scorers.mdx',
        },
        {
          title: 'Set up storage providers',
          path: '/guide/providers',
          include: 'docs/guide/providers.mdx',
        },
        {
          title: 'Inspect results',
          path: '/guide/results',
          include: 'docs/guide/results.mdx',
        },
        {
          title: 'Run in CI',
          path: '/guide/ci',
          include: 'docs/guide/ci.mdx',
        },
        {
          title: 'Migrate to v1',
          path: '/guide/migration',
          include: 'docs/guide/migration.mdx',
        },
      ],
    },
    {
      title: 'CLI',
      path: '/cli',
      description:
        'Command syntax, arguments, options, and execution behavior.',
      discover: { sort: 'none' as const },
      pages: [
        {
          title: 'run',
          path: '/cli/run',
          include: 'docs/cli/run.md',
        },
        {
          title: 'init',
          path: '/cli/init',
          include: 'docs/cli/init.md',
        },
        {
          title: 'data',
          path: '/cli/data',
          include: 'docs/cli/data.md',
        },
        {
          title: 'ui',
          path: '/cli/ui',
          include: 'docs/cli/ui.md',
        },
      ],
    },
    {
      title: 'Reference',
      description:
        'Reference evaluation APIs, scoring functions, configuration, and storage contracts.',
      discover: { sort: 'none' as const },
      pages: [
        {
          title: 'evaluate()',
          path: '/api/evaluate',
          include: 'docs/api/evaluate.mdx',
        },
        {
          title: 'defineDataset()',
          path: '/api/define-dataset',
          include: 'docs/api/define-dataset.mdx',
        },
        {
          title: 'sampleItems()',
          path: '/api/sample-items',
          include: 'docs/api/sample-items.mdx',
        },
        {
          title: 'Configuration',
          path: '/api/configuration',
          include: 'docs/api/configuration.mdx',
        },
        {
          title: 'Scoring',
          description:
            'Choose built-in scorers, write custom scoring functions, and configure judge models.',
          path: '/api/scoring',
          discover: { sort: 'none' as const },
          pages: [
            {
              title: 'Built-in scorers',
              path: '/api/scoring/scorers',
              include: 'docs/api/scorers.mdx',
            },
            {
              title: 'createScorer()',
              path: '/api/scoring/create-scorer',
              include: 'docs/api/create-scorer.mdx',
            },
            {
              title: 'wrapScorer()',
              path: '/api/scoring/wrap-scorer',
              include: 'docs/api/wrap-scorer.mdx',
            },
          ],
        },
        {
          title: 'Storage & results',
          description:
            'Configure storage providers and write local evaluation snapshots.',
          path: '/api/storage',
          discover: { sort: 'none' as const },
          pages: [
            {
              title: 'Providers',
              path: '/api/storage/create-provider',
              include: 'docs/api/create-provider.mdx',
            },
            {
              title: 'Provider types',
              path: '/api/storage/provider-types',
              include: 'docs/api/provider-types.mdx',
            },
          ],
        },
      ],
    },
    { title: 'Examples', path: '/examples', include: 'docs/examples/index.md' },
  ].map((page) => ({ ...page, defaults: { head: SITE_HEAD } })),
});
