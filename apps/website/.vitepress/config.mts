import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vitepress';
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from 'vitepress-plugin-group-icons';
import llmstxt from 'vitepress-plugin-llms';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Viteval',
  lang: 'en-US',
  appearance: 'force-dark',
  description: 'Next generation LLM evaluation framework powered by Vitest.',
  cleanUrls: true,
  sitemap: {
    hostname: 'https://viteval.dev',
  },
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    [
      'meta',
      {
        property: 'og:title',
        content:
          'Viteval | Next generation LLM evaluation framework powered by Vitest.',
      },
    ],
    ['meta', { property: 'og:site_name', content: 'Viteval' }],
    // [
    //   'meta',
    //   {
    //     property: 'og:image',
    //     content: 'https://joggrdocs.github.io/tempo/images/tempo-social.png',
    //   },
    // ],
    ['meta', { property: 'og:url', content: 'https://viteval.dev/' }],
    [
      'script',
      {
        async: '',
        src: 'https://www.googletagmanager.com/gtag/js?id=G-FEVDX1MG6E',
      },
    ],
    [
      'script',
      {},
      `window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-FEVDX1MG6E');`,
    ],
  ],
  themeConfig: {
    logo: '/assets/viteval.png',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/evaluate' },
      { text: 'Examples', link: '/examples/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/concepts' },
            { text: 'CLI Usage', link: '/guide/cli' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'CI Integration', link: '/guide/advanced/ci' },
            { text: 'Reporters', link: '/guide/advanced/reporters' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'defineConfig()', link: '/api/configuration' },
            { text: 'evaluate()', link: '/api/evaluate' },
            { text: 'defineDataset()', link: '/api/define-dataset' },
            { text: 'createScorer()', link: '/api/create-scorer' },
            { text: 'scorers', link: '/api/scorers' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            {
              text: 'Basic',
              link: 'https://github.com/viteval/viteval/tree/main/examples/basic',
              target: '_blank',
              rel: 'noopener noreferrer',
            },
            {
              text: 'Vercel AI SDK',
              link: 'https://github.com/viteval/viteval/tree/main/examples/vercel-ai',
              target: '_blank',
              rel: 'noopener noreferrer',
            },
            {
              text: 'Voltagent',
              link: 'https://github.com/viteval/viteval/tree/main/examples/voltagent',
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/viteval/viteval' },
      { icon: 'discord', link: 'https://discord.gg/2MFYxEdJQB' },
    ],
    search: {
      provider: 'local',
    },
    editLink: {
      pattern: 'https://github.com/viteval/viteval/edit/main/apps/website/:path',
    },
  },
  markdown: {
    config: (md) => {
      md.use(groupIconMdPlugin);
    },
  },
  vite: {
    plugins: [UnoCSS(), groupIconVitePlugin(), llmstxt()],
  },
});
