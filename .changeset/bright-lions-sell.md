---
"viteval": minor
"@viteval/core": minor
"@viteval/cli": minor
"@viteval/ui": minor
---

## Eval Results UI (alpha)

You can now view the results of your evals in a local UI that is built on top of the Viteval JSON File (`file`) reporter.

To enable the UI, pass the `--ui` flag to the `viteval run` command.

```sh
viteval run --ui
```

The UI will be available at `http://localhost:3000`.