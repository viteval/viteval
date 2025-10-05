# Reporters

You can use provided reporters to get the results of your evals in a variety of formats.

## Built-in Reporters

### `default`

The default reporter will print the results to the console.

### `json`

The json reporter will print the results to a JSON file. You can pass this in the CLI or in your config file.

```ts
export default defineConfig({
  reporters: ['json'],
});
```

```sh
viteval run --reporters json
```

### `file`

The file reporter will print the results to a file. You can pass this in the CLI or in your config file.

```ts
export default defineConfig({
  reporters: ['file'],
});
```

```sh
viteval run --reporters file
```

## Multiple Reporters

You can pass multiple reporters to the CLI or in your config file. This allows you to combine the default reporter with the file reporter to get the results in both formats.

```ts
export default defineConfig({
  reporters: ['default', 'file'],
});
```

```sh
viteval run --reporters default file
```

## Custom Reporters

> [!CAUTION]
## Custom reporters

You can point Viteval to any Vitest-compatible reporter module. When you pass a relative path it will be resolved against your project root:

```ts title="viteval.config.ts"
import { defineConfig } from 'viteval/config';

export default defineConfig({
  reporters: ['./src/reporters/voltops-reporter.ts'],
});
```

Or via the CLI:

```bash
viteval run --reporters ./src/reporters/voltops-reporter.ts
```

You can also supply a package name (for example `@acme/viteval-reporter`) after installing it in your project.
