---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Viteval"
  text: "Next Generation Eval Framework"
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

---

<div class="flex flex-col items-center justify-center mt-10">
<div class="i-mdi:heart-outline size-8 block text-center ml-auto mr-auto"></div>
<p class="text-center mt-1 mx-auto">
  Viteval is free and open source, <br/>
  made possible by wonderful sponsors.
</p>
</div>

<div class="w-full">
  <div class="flex flex-col items-center justify-center mt-10 w-full">
    <div class="px-2 py-0 bg-gray-800 w-full rounded-t-lg mb-1">
      <p class="text-center font-bold">Special Sponsors</p>
    </div>
    <a href="https://joggr.ai?utm_source=viteval&utm_medium=banner&utm_campaign=web" target="_blank" rel="noopener noreferrer" class="bg-gray-800 cursor-pointer hover:bg-gray-700 w-full rounded-b-lg">
      <div class="flex flex-row items-center justify-center px-10 py-16">
        <img src="/assets/joggr.png" alt="Joggr" class="w-[300px] h-auto" />
      </div>
    </a>
  </div>
</div>

