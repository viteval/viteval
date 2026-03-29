import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vitepress';
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from 'vitepress-plugin-group-icons';
import llmstxt from 'vitepress-plugin-llms';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  appearance: 'force-dark',
  cleanUrls: true,
  description: 'Next generation LLM evaluation framework powered by Vitest.',
  head: [
    ['link', { href: '/favicon.ico', rel: 'icon' }],
    ['meta', { content: 'website', property: 'og:type' }],
    ['meta', { content: 'en', property: 'og:locale' }],
    [
      'meta',
      {
        content:
          'Viteval | Next generation LLM evaluation framework powered by Vitest.',
        property: 'og:title',
      },
    ],
    ['meta', { content: 'Viteval', property: 'og:site_name' }],
    // [
    //   'meta',
    //   {
    //     Property: 'og:image',
    //     Content: 'https://joggrdocs.github.io/tempo/images/tempo-social.png',
    //   },
    // ],
    ['meta', { content: 'https://viteval.dev/', property: 'og:url' }],
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
  lang: 'en-US',
  markdown: {
    config: (md) => {
      md.use(groupIconMdPlugin);
    },
  },
  sitemap: {
    hostname: 'https://viteval.dev',
  },
  themeConfig: {
    logo: '/assets/viteval.png',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { link: '/', text: 'Home' },
      { link: '/guide/getting-started', text: 'Guide' },
      { link: '/api/evaluate', text: 'API' },
      { link: '/examples/', text: 'Examples' },
    ],
    sidebar: {
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
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/viteval/viteval' },
      { icon: 'discord', link: 'https://discord.gg/2MFYxEdJQB' },
    ],
    search: {
      provider: 'local',
    },
    editLink: {
      pattern:
        'https://github.com/viteval/viteval/edit/main/apps/website/:path',
    },
  },
  title: 'Viteval',
  vite: {
    plugins: [UnoCSS(), groupIconVitePlugin(), llmstxt()],
  },
});
