import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Viteval",
  description: "Next generation LLM evaluation framework powered by Vitest.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/evaluate' },
      { text: 'Examples', link: '/examples/' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/concepts' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'CLI Usage', link: '/guide/cli' }
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Best Practices', link: '/guide/best-practices' },
            { text: 'CI/CD Integration', link: '/guide/cicd' },
            { text: 'Migration Guide', link: '/guide/migration' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'evaluate()', link: '/api/evaluate' },
            { text: 'defineDataset()', link: '/api/define-dataset' },
            { text: 'createScorer()', link: '/api/create-scorer' },
            { text: 'Built-in Scorers', link: '/api/scorers' },
            { text: 'Configuration', link: '/api/configuration' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Basic Evaluation', link: '/examples/basic' },
            { text: 'Custom Datasets', link: '/examples/datasets' },
            { text: 'Custom Scorers', link: '/examples/scorers' },
            { text: 'Advanced Patterns', link: '/examples/advanced' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/zrosenbauer/viteval' }
    ],

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/zrosenbauer/viteval/edit/main/docs/:path'
    }
  }
})
