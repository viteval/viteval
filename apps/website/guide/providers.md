# Providers

JSON files are the default storage backend. Dataset files live under
`.viteval/datasets`; reporter snapshots and provider runs live under
`.viteval/results`. The dashboard reads the same formats.

`@viteval/providers` and every backend SDK/driver are opt-in. Importing a provider
factory does not load its SDK. Install the packages for the backend you select;
initialization reports missing packages with installation guidance.

## Default JSON setup

`viteval init` creates a setup module equivalent to:

```ts
import { fileURLToPath } from 'node:url';
import { createJsonProvider, initializeProvider } from 'viteval/provider';

const provider = createJsonProvider({
  root: fileURLToPath(new URL('.', import.meta.url)),
});
const initialized = await initializeProvider({ datasets: provider });
if (!initialized.ok) throw initialized.error;
```

Register this file in Vitest's `test.setupFiles`. Binding the root in setup keeps
dataset storage correct when you use `--root` or multiple Vitest projects.
Without a configured dataset provider, local datasets use the current working
directory.

The JSON reporter writes a combined run snapshot. JSON provider operations can
read both those snapshots and runs created through the provider API. Reporter
snapshots are finalized history; provider-created running records accept new results.

## SQLite

Install the optional provider package:

```bash
pnpm add -D @viteval/providers @prisma/client@^7.10 @prisma/adapter-better-sqlite3@^7.10 better-sqlite3
```

Configure it in `viteval.setup.ts`:

```ts
import { afterAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { initializeProvider } from 'viteval/provider';
import { viteval } from '@viteval/providers/viteval';

const provider = viteval({
  database: 'sqlite',
  path: fileURLToPath(new URL('.viteval/evals.db', import.meta.url)),
});
const initialized = await initializeProvider(provider);
if (!initialized.ok) throw initialized.error;

afterAll(async () => {
  const closed = await provider.close();
  if (!closed.ok) throw closed.error;
});
```

Evaluation suites persist their final case outcomes to the configured evaluation
provider. Keep the JSON reporter configured to inspect a local copy in the
dashboard. SQLite schema/client assets are included in the package; consumers
do not run Prisma generation. `viteval()` with no database option returns JSON.

The PostgreSQL option is experimental and outside the verified v1 contract.

## Braintrust

```bash
pnpm add -D @viteval/providers @braintrust/api
```

```ts
import { initializeProvider } from 'viteval/provider';
import { braintrust } from '@viteval/providers/braintrust';

const initialized = await initializeProvider(
  braintrust({
    project: 'answer-quality',
    apiKey: process.env.BRAINTRUST_API_KEY,
  })
);
if (!initialized.ok) throw initialized.error;
```

The provider finds or creates the named project. Datasets use Braintrust's
dataset API; suites create distinct experiments so reruns preserve history.
Pagination and configuration metadata are preserved. Provider tests exercise the
official SDK against local HTTP contract fixtures for dataset pagination and
replacement, experiment creation, result writes, completion metadata, and result
pagination. These tests verify Viteval's adapter and are sufficient for the v1
release gate. Live Braintrust account testing is not required; using the provider
against your account requires your own credentials.

## Langfuse

```bash
pnpm add -D @viteval/providers @langfuse/client @opentelemetry/api @opentelemetry/sdk-trace-base @opentelemetry/exporter-trace-otlp-http
```

```ts
import { afterAll } from 'vitest';
import { initializeProvider } from 'viteval/provider';
import { langfuse } from '@viteval/providers/langfuse';

const provider = langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY ?? '',
  secretKey: process.env.LANGFUSE_SECRET_KEY ?? '',
  baseUrl: 'https://cloud.langfuse.com',
});
const initialized = await initializeProvider({ evals: provider });
if (!initialized.ok) throw initialized.error;

afterAll(async () => {
  const closed = await provider.close();
  if (!closed.ok) throw closed.error;
});
```

Viteval publishes each case as a separate experiment-item trace and writes scores
through the official Langfuse API client. It uses the v4 OpenTelemetry ingestion
path and v2 Observations API, with an isolated tracer provider that does not
replace your application's global OpenTelemetry configuration. Regional and
self-hosted URLs are supported. Export failures fail persistence explicitly.

Completed run snapshots and paginated case outcomes can be read through the
provider from a fresh process. Datasets support creation, reads, pagination, and
item additions. Local inputs can be correlated as experiment items without
uploading a managed dataset; callers can supply `metadata.datasetItemId` when
writing results directly to link an existing Langfuse item.

The SDK does not expose dataset rename/update or deletion. Atomic item replacement
is not supported. These operations return explicit errors; manage those operations
in Langfuse or create a new dataset.

## VoltOps hosted evaluations

```bash
pnpm add -D @viteval/providers @voltagent/sdk
```

```ts
import { afterAll } from 'vitest';
import { initializeProvider } from 'viteval/provider';
import { voltops } from '@viteval/providers/voltops';

const provider = voltops({
  publicKey: process.env.VOLTAGENT_PUBLIC_KEY ?? '',
  secretKey: process.env.VOLTAGENT_SECRET_KEY ?? '',
  baseUrl: 'https://api.voltagent.dev',
  triggerSource: 'ci',
});
const initialized = await initializeProvider({ evals: provider });
if (!initialized.ok) throw initialized.error;

afterAll(async () => {
  const closed = await provider.close();
  if (!closed.ok) throw closed.error;
});
```

This provider publishes evaluations to the hosted VoltOps platform, including
experiments, registered scorers, batched case outcomes, thresholds, errors, and
completion summaries. Runs are created with `autoQueue: false`: Vitest executes
the task and scorers, while VoltOps stores their outcomes. It does not launch a
second hosted agent execution. It works with any Viteval task, including VoltAgent
agents.

Set `datasetId` to bind runs to a hosted dataset's latest version, or
`experimentId` to bind them to an existing experiment. Otherwise, suite runs
create distinct experiments. Hosted datasets support creation/upload and paginated
reads. Adding items creates a new version using VoltAgent's published upload
routes through the SDK's authenticated transport.

The current VoltOps SDK does not expose historical run retrieval/listing or dataset
rename/update/deletion. `evals.get()` reads runs created by the current provider
session; unavailable historical reads and `evals.list()` return explicit errors.
Inspect persisted runs in the [VoltOps console](https://console.voltagent.dev/).
Atomic dataset replacement is not supported; failed multi-request uploads may
leave a partial new version, while prior versions remain available.

Both integrations are verified with official SDKs against local HTTP fixtures;
live accounts are not release-test requirements. Keep the JSON reporter configured
for local dashboard inspection alongside hosted persistence.

## S3 and Google Cloud Storage datasets

Object storage providers handle datasets independently of your results backend.
Choose the optional SDK for your bucket:

```bash
# S3
pnpm add -D @viteval/providers @aws-sdk/client-s3

# Google Cloud Storage
pnpm add -D @viteval/providers @google-cloud/storage
```

Configure the dataset provider in your worker setup:

```ts
import { afterAll } from 'vitest';
import { initializeProvider } from 'viteval/provider';
import { s3 } from '@viteval/providers/s3';

const datasets = s3({
  bucket: 'evaluation-data',
  prefix: 'my-project/datasets',
  clientOptions: { region: 'us-east-1' },
});
const initialized = await initializeProvider({ datasets });
if (!initialized.ok) throw initialized.error;

afterAll(async () => {
  const closed = await datasets.close();
  if (!closed.ok) throw closed.error;
});
```

Use Google Cloud Storage with the same setup pattern:

```ts
import { gcs } from '@viteval/providers/gcs';

const datasets = gcs({
  bucket: 'evaluation-data',
  prefix: 'my-project/datasets',
  clientOptions: { projectId: 'my-google-project' },
});
```

Buckets must already exist. `clientOptions` accepts the standard SDK configuration:
AWS credential chains and custom endpoints, or Google Application Default
Credentials and client settings. S3-compatible endpoints can be configured with
`endpoint` and `forcePathStyle`; compatibility requires the service to enforce
conditional writes. AWS/GCS SDK protocols are tested against local HTTP fixtures;
individual S3-compatible services are not separately verified.

Both providers support create, read, list, rename, metadata updates, item additions,
replacement, and deletion from the active catalog. They expose only the dataset
domain. You can combine them with JSON, Braintrust, Langfuse, or VoltOps results.

### Atomic publication and retained versions

The default namespace is `viteval/datasets`. Each namespace contains:

- `index.json`: a validated catalog of dataset metadata and current version pointers.
- `versions/<uuid>.json`: immutable dataset snapshots.

An update uploads its immutable snapshot first, then conditionally publishes the
catalog pointer. S3 uses ETags with `If-Match`/`If-None-Match`; GCS uses generation
preconditions. Conflicting writers reread the catalog and reapply their update.
The catalog records a SHA-256 digest for each snapshot; reads reject rewritten or
corrupted snapshot contents.
`maxAttempts` controls the conflict budget and defaults to 16. Listing pagination
is applied to the catalog, independently of bucket object listing.

A failed snapshot upload or rejected catalog write leaves the previously visible
version intact. Network errors are surfaced without automatically replaying writes:
if the server committed a write but its response was lost, read the dataset before
manually retrying the operation. Google downloads retain SDK checksum validation
and capture the generation token from the same response as their content.

Deleting a dataset removes its active catalog entry. Prior snapshots and snapshots
from unsuccessful publication attempts remain in the bucket so readers of an
earlier catalog cannot lose their referenced data. Cleanup must preserve objects
referenced by the current catalog. No automatic garbage collection is performed.

## Serialization and failures

VoltOps dataset creation and `addItems` upload versions through multiple requests.
They are not failure-safe: a failed item upload can leave an incomplete latest
version that subsequent reads return. Errors include the dataset and version IDs;
inspect and repair that version in the VoltOps console before retrying. Previous
versions are retained remotely. The SDK does not expose transactional publication
or version deletion, so atomic replacement remains unsupported.

Braintrust creation attempts to delete a newly created dataset if its metadata
or initial item write fails. If cleanup is also rejected, the error retains the
original failure and identifies the dataset that needs manual cleanup.

- Store JSON-compatible inputs, expected values, outputs, and metadata. Dates serialize to ISO strings.
- Native JSON and SQLite providers normalize undefined inputs, expected values, and outputs to null. Optional object fields remain omitted.
- Non-finite numbers, BigInt, functions, symbols, cycles, and unsupported object classes fail explicitly.
- JSON writes use a temporary file and atomic rename. Serialization failure preserves the previous file.
- Local JSON dataset/tag updates use a cross-process lock. A lock timeout identifies the affected file; if a writer was interrupted, confirm it has stopped before removing its `.lock` directory.
- `storage: 'memory'` datasets regenerate on load and are not written to disk.

Provider operations return `Result` values. Check `ok` before reading `value`;
initialization and persistence errors fail the evaluation run.
