---
title: ui
description: Start the local dashboard server to inspect saved evaluation reports and datasets.
---

# `ui`

Start the dashboard using the server and browser assets included in the installed
package. No development server is required.

## Usage

```bash
viteval ui [options]
```

## Options

| Option                  | Default           | Description                                                                     |
| ----------------------- | ----------------- | ------------------------------------------------------------------------------- |
| `--root <path>`, `-r`   | Current directory | Project root containing `.viteval`                                              |
| `--port <number>`, `-p` | `6274`            | Preferred port between 1 and 65535. Falls back to an available port if occupied |
| `--open`, `-o`          | `false`           | Open the dashboard in the browser                                               |
| `--debug`, `-d`         | `false`           | Enable debug mode, also enabled by `VITEVAL_DEBUG_MODE=true`                    |

## Data source

The dashboard reads datasets and evaluation results from the selected root's
`.viteval` directory. Select `eval.results: ['json']` to save evaluation
snapshots under `.viteval/results`.

Hosted provider results are not downloaded automatically. Keep a local report
alongside hosted persistence if you want to inspect the same run here.

Dashboard, results, datasets, suites, and settings URLs support direct navigation
and reloads. Stop the server with Ctrl+C.

## Examples

```bash
viteval ui
viteval ui --root ./app
viteval ui --port 6274 --open
```

See [inspect results](/guide/results) for report configuration and the inspection
workflow.
