<p align="center">
<a href="https://vitest.dev">
<img src="./assets/viteval-icon.png" height="200">
</a>
</p>

<h1 align="center">
Viteval
</h1>
<p align="center">
AI Evals combined with Vitest into one framework!
<p>
<p align="center">
  <a href="https://www.npmjs.com/package/viteval"><img src="https://img.shields.io/npm/v/viteval?color=BE54F5&label="></a>
<p>

<!-- TODO: add documentation -->
<!-- <p align="center">
 <a href="https://viteval.dev">Documentation</a> | <a href="https://viteval.dev/guide/">Getting Started</a> | <a href="https://viteval.dev/guide/#examples">Examples</a> | <a href="https://viteval.dev/guide/why">Why Viteval?</a>
</p> -->
<br>
<br>

## Installation

```bash
npm install viteval
```

## Example

You can use `viteval` to evaluate your LLM and add tests in your CI in one single file.

```ts
import { evaluate, scorers } from 'viteval';
import { generateText } from 'ai';

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

Now you can run the eval by running:

```bash
viteval
```

