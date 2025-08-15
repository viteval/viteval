---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Viteval"
  text: "Next generation LLM evaluation framework powered by Vitest."
  tagline: Define, run, and debug LLM evaluations with a familiar API
  image:
    src: /assets/viteval.png
    alt: Viteval
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View Examples
      link: /examples/

features:
  - title: Vitest-like API
    details: Define and run evaluations the same way you run tests, with a familiar and intuitive interface
    icon: ⚡
  - title: Local & Remote Datasets
    details: Create datasets locally or pull from databases, APIs, and external sources with built-in caching
    icon: 📊
  - title: Flexible Scoring
    details: Use built-in scorers for common tasks or create custom scoring functions for specific needs
    icon: 🎯
  - title: CI/CD Ready
    details: Integrate seamlessly into your CI pipeline and run evaluations alongside your tests
    icon: 🔄
  - title: Comprehensive Scorers
    details: 15+ built-in scorers including factual accuracy, similarity, moderation, and custom options
    icon: 📏
  - title: Developer Experience
    details: TypeScript support, clear error messages, and detailed reporting for efficient debugging
    icon: 🛠️
---

## Quick Example

```ts
import { evaluate, scorers } from 'viteval';

evaluate('Color detection', {
  data: async () => [
    { input: "What color is the sky?", expected: "Blue" },
    { input: "What color is grass?", expected: "Green" },
  ],
  task: async (input) => {
    const result = await generateText(input);
    return result.text;
  },
  scorers: [scorers.levenshtein],
  threshold: 0.8,
});
```

```bash
# Run evaluations
npx viteval
```

