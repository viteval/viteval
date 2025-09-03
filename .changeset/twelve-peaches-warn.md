---
"@viteval/core": patch
"@viteval/cli": patch
---

## Reporters

You can now pass reporters to the CLI or in your config file. This allows you to output JSON to `stdout` as well as a file.

Add to your config file:

```ts
export default defineConfig({
  reporters: ['file'],
});
```

Or via the CLI:

```sh
viteval run --reporters=file
```

### Multiple Reporters

You can pass multiple reporters to the CLI or in your config file. This allows you to combine the default reporter with the file reporter to get the results in both formats.

```ts
export default defineConfig({
  reporters: ['default', 'file'],
});
```