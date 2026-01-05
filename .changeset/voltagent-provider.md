---
"@viteval/core": minor
"@viteval/voltagent": minor
"viteval": minor
---

Add VoltAgent dataset provider support for fetching datasets from VoltOps.

- Add `DatasetProvider` interface to `@viteval/core` for remote dataset sources
- Create `@viteval/voltagent` package for VoltOps integration
- Support fetching datasets from VoltOps with local caching
- Add type mapping from VoltAgent `ExperimentDatasetItem` to Viteval `DataItem`
