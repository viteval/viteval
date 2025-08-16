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
  - title: Powered by Vitest
    details: Define and run evaluations the same way you run tests, with a familiar and intuitive interface
    icon: <div class="i-logos:vitest"></div>
  - title: Fully Featured
    details: Run evals, create datasets, and more with everything you need out of the box
    icon: <div class="i-material-icon-theme:test-ts"></div>
  - title: CI/CD Ready
    details: Integrate seamlessly into your CI pipeline and run evaluations alongside your tests
    icon: <div class="i-logos:github-actions"></div>
---

## See it in action

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
