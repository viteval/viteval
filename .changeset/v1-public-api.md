---
'@viteval/core': minor
'@viteval/cli': minor
'@viteval/providers': minor
'viteval': minor
---

Define the V1 public API with Viteval-owned configuration, worker-local model and
storage dependencies, and array-selected dataset/result destinations.

Use `viteval.config.ts`, raw AI SDK providers, and direct evaluation execution
options instead of required native runner configuration or setup modules. Generate
datasets once across selected providers and choose evaluation read sources
independently. JSON result persistence produces dashboard-readable snapshots
without requiring a reporter. Integration imports contribute typed capabilities
and callback handles. Update init templates, examples, and documentation.
