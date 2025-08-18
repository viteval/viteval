<p align="center">
<a href="https://viteval.dev">
<img src="./.github/assets/viteval-icon.png" height="200">
</a>
</p>

<h1 align="center">
Viteval
</h1>
<p align="center">
Next generation LLM evaluation framework powered by Vitest.
<p>
<p align="center">
  <a href="https://www.npmjs.com/package/viteval"><img src="https://img.shields.io/npm/v/viteval?color=BE54F5&label="></a>
<p>

<p align="center">
 <a href="https://viteval.dev">Documentation</a> | <a href="https://viteval.dev/guide/getting-started ">Getting Started</a> | <a href="https://viteval.dev/examples">Examples</a>
</p>
<br>
<br>

## Features

- ✅ Vitest-like API: easily define and run evals the same way you run tests.
- ✅ Local Dataset: quickly define and generate datasets that are stored locally or in a database.
- ✅ Scorer framework: easily define and use scorers to evaluate your LLM.
- ✅ CI ready: easily integrate with your CI pipeline and run evals the same way you run tests.
- (SOON) Reporters: custom reporters to help you visualize your evals, or upload them to a vendor 
- (SOON) Remote Dataset: easily define & use datasets that are stored in a database, S3 bucket, or a vendor

## Installation

```bash
npm install viteval
```

## Usage

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
npx viteval
```

