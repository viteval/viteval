---
'@viteval/cli': patch
'@viteval/providers': patch
'viteval': patch
---

Normalize dataset discovery identifiers across platforms and align generated env
paths and configuration templates, including ESM-compatible configs for CommonJS
projects. Isolate Langfuse run history by decoded run
identity and supported API filters, resolve one SDK/exporter host, roll back
failed Braintrust dataset creation when possible, and stabilize VoltOps dataset
item hashes. Diagnose incomplete VoltOps upload versions and document snapshot
retention and legacy database tagging capability limits.
