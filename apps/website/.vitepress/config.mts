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
          items: [
            { link: '/api/configuration', text: 'defineConfig()' },
            { link: '/api/evaluate', text: 'evaluate()' },
            { link: '/api/define-dataset', text: 'defineDataset()' },
            { link: '/api/create-scorer', text: 'createScorer()' },
            { link: '/api/scorers', text: 'scorers' },
          ],
          text: 'API Reference',
        },
      ],
      '/examples/': [
        {
          items: [
            {
              link: 'https://github.com/viteval/viteval/tree/main/examples/basic',
              rel: 'noopener noreferrer',
              target: '_blank',
              text: 'Basic',
            },
            {
              link: 'https://github.com/viteval/viteval/tree/main/examples/vercel-ai',
              rel: 'noopener noreferrer',
              target: '_blank',
              text: 'Vercel AI SDK',
            },
            {
              link: 'https://github.com/viteval/viteval/tree/main/examples/voltagent',
              rel: 'noopener noreferrer',
              target: '_blank',
              text: 'Voltagent',
            },
          ],
          text: 'Examples',
        },
      ],
      '/guide/': [
        {
          items: [
            { link: '/guide/getting-started', text: 'Getting Started' },
            { link: '/guide/concepts', text: 'Core Concepts' },
            { link: '/guide/cli', text: 'CLI Usage' },
          ],
          text: 'Introduction',
        },
        {
          items: [
            { link: '/guide/advanced/ci', text: 'CI Integration' },
            { link: '/guide/advanced/reporters', text: 'Reporters' },
          ],
          text: 'Advanced',
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
