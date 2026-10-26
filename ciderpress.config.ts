import { BUILT_IN_THEMES, defineTheme } from '@ciderpress/theme';
import { defineConfig } from 'ciderpress';

import pkg from './packages/viteval/package.json' with { type: 'json' };

const midnightDark = BUILT_IN_THEMES.midnight.variants.dark!;
const honeycrispLight = BUILT_IN_THEMES.honeycrisp.variants.light!;
const SITE_HEAD: [string, Record<string, string>][] = [
  ['script', { type: 'module', src: '/github-stars.js' }],
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
      content: '/assets/viteval-loading.svg',
      label: 'Loading Viteval',
    },
  },
  footer: {
    message: 'TypeScript-native evals, powered by Vitest.',
    copyright: true,
    tagline: 'MIT licensed',
    columns: [
      {
        heading: 'Start here',
        links: [
          { text: 'Why Viteval', href: '/features' },
          { text: 'Getting started', href: '/guide/getting-started' },
          { text: 'Core concepts', href: '/guide/concepts' },
          { text: 'Examples', href: '/examples' },
        ],
      },
      {
        heading: 'Reference',
        links: [
          { text: 'Configuration', href: '/api/configuration' },
          { text: 'Evaluations', href: '/api/evaluate' },
          { text: 'Datasets', href: '/api/define-dataset' },
          { text: 'Scorers', href: '/api/scorers' },
        ],
      },
      {
        heading: 'Workflow',
        links: [
          { text: 'CLI and dashboard', href: '/guide/cli' },
          { text: 'CI integration', href: '/guide/advanced/ci' },
          { text: 'Reporters', href: '/guide/advanced/reporters' },
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
      message:
        'V1 release candidate available. V0 support ends at the v1 launch.',
      cta: { href: '/guide/migration', label: 'Migrate to v1' },
      persistent: true,
    },
    nav: [
      { title: 'Features', link: '/features' },
      { title: 'Guide', link: '/guide/getting-started' },
      { title: 'API', link: '/api/evaluate' },
      { title: 'Examples', link: '/examples' },
    ],
    cta: { text: 'Star on GitHub', href: 'https://github.com/viteval/viteval' },
  },
  pages: [
    { title: 'Viteval', path: '/', include: 'docs/index.mdx' },
    { title: 'Features', path: '/features', include: 'docs/features.mdx' },
    { title: 'Brand & assets', path: '/brand', include: 'docs/brand.mdx' },
    {
      title: 'Guide',
      pages: [
        {
          title: 'Getting started',
          path: '/guide/getting-started',
          include: 'docs/guide/getting-started.md',
        },
        {
          title: 'Core concepts',
          path: '/guide/concepts',
          include: 'docs/guide/concepts.md',
        },
        {
          title: 'CLI usage',
          path: '/guide/cli',
          include: 'docs/guide/cli.md',
        },
        {
          title: 'Providers',
          path: '/guide/providers',
          include: 'docs/guide/providers.md',
        },
        {
          title: 'Migrate to v1',
          path: '/guide/migration',
          include: 'docs/guide/migration.md',
        },
      ],
    },
    {
      title: 'Advanced',
      pages: [
        {
          title: 'CI integration',
          path: '/guide/advanced/ci',
          include: 'docs/guide/advanced/ci.md',
        },
        {
          title: 'Reporters',
          path: '/guide/advanced/reporters',
          include: 'docs/guide/advanced/reporters.md',
        },
      ],
    },
    {
      title: 'API reference',
      pages: [
        {
          title: 'Configuration',
          path: '/api/configuration',
          include: 'docs/api/configuration.md',
        },
        {
          title: 'evaluate()',
          path: '/api/evaluate',
          include: 'docs/api/evaluate.md',
        },
        {
          title: 'defineDataset()',
          path: '/api/define-dataset',
          include: 'docs/api/define-dataset.md',
        },
        {
          title: 'createScorer()',
          path: '/api/create-scorer',
          include: 'docs/api/create-scorer.md',
        },
        {
          title: 'Scorers',
          path: '/api/scorers',
          include: 'docs/api/scorers.md',
        },
      ],
    },
    { title: 'Examples', path: '/examples', include: 'docs/examples/index.md' },
  ].map((page) => ({ ...page, defaults: { head: SITE_HEAD } })),
});
