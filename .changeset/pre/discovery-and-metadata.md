---
'@viteval/cli': patch
'@viteval/providers': patch
'viteval': patch
---

Initialize dataset discovery before user setup modules so setup-imported inline
datasets are generated once without collecting evaluation work. Preserve
Braintrust dataset metadata through the SDK's supported update operation.
