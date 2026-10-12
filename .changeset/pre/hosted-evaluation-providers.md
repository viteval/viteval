---
'@viteval/providers': minor
---

Add opt-in Langfuse and hosted VoltOps providers with lazy official SDK loading,
dataset reads/uploads, hosted case outcomes, and explicit SDK capability errors.
Langfuse uses v4 OpenTelemetry ingestion and supports completed-run history;
VoltOps registers scorers, uploads batches, and completes non-auto-queued runs.

Make Prisma and SQLite drivers optional peers. JSON-only consumers no longer
install native database dependencies; SQLite users install its client and driver
packages explicitly.
