# CLI Troubleshooting

Common CLI issues and fixes.

## viteval command not found

CLI command not recognized.

**Fix:** Build packages and ensure viteval is installed.

```bash
pnpm build
pnpm --filter viteval link --global
```

Or run via pnpm:

```bash
pnpm viteval run
```

## Config file not found

CLI can't find `viteval.config.ts`.

**Fix:** Create config file in project root.

```bash
touch viteval.config.ts
```

Or specify path:

```bash
viteval run --config ./path/to/config.ts
```

## Evaluation timeout

Evaluations fail with timeout errors.

**Fix:** Increase timeout in config.

```ts
// viteval.config.ts
export default defineConfig({
  timeout: 60000, // 60 seconds
});
```

## LLM API errors

Evaluations fail with API errors.

**Fix:** Check environment variables.

```bash
# Verify API key is set
echo $OPENAI_API_KEY
```

Common issues:
- Missing API key
- Invalid API key
- Rate limiting

## Watch mode not working

Changes not detected in watch mode.

**Fix:** Check file patterns.

```bash
# Specify include patterns
viteval run --watch "**/*.eval.ts"
```

## Reporter not found

Custom reporter fails to load.

**Fix:** Verify reporter path and exports.

```ts
// Ensure default export
export default myReporter;
```

## References

- [Commands](../commands.md)
- [Development](../development.md)
