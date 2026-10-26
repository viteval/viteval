# Providers

Viteval is open source and uses local JSON storage by default. You do not need a
hosted evaluation account. With the default JSON provider, datasets live under
`.viteval/datasets` and runs under `.viteval/results`. The JSON reporter also
writes local snapshots for dashboard inspection. Configured hosted providers
such as Braintrust, Langfuse, and VoltOps persist runs through their own services;
they do not move those hosted runs into the local directory.

`@viteval/providers` and every backend SDK/driver are opt-in. Importing a provider
factory does not load its SDK. Install the packages for the backend you select;
initialization errors list any missing packages and how to install them.

Use `@viteval/providers@rc` alongside `viteval@rc` during the prerelease. The
untagged provider package can resolve to an older release candidate.

Choose providers independently for datasets and evaluation results:

| Provider             | Datasets                       | Evaluation results                  |
| -------------------- | ------------------------------ | ----------------------------------- |
| JSON (default)       | Local files                    | Local files                         |
| SQLite               | Local database                 | Local database                      |
| Braintrust           | Hosted datasets                | Experiments and case results        |
| Langfuse             | Create, read, and add items    | Case traces and scores              |
| VoltOps              | Upload versions and read items | Hosted experiments and case results |
| Amazon S3            | Versioned objects              | Use a separate results provider     |
| Google Cloud Storage | Versioned objects              | Use a separate results provider     |

These providers store evaluation data. They do not choose the model used by your
task. Call your model client inside the task function; configure models for
built-in judges and embedding scorers with `initializeModel()`.

## Combine providers

Pass `datasets` and `evals` separately to `initializeProvider()`. For example,
keep datasets in local JSON files and publish results to Braintrust:

```ts
import { fileURLToPath } from 'node:url';
import { createJsonProvider, initializeProvider } from 'viteval/provider';
import { braintrust } from '@viteval/providers/braintrust';

const initialized = await initializeProvider({
  datasets: createJsonProvider({
    root: fileURLToPath(new URL('.', import.meta.url)),
  }),
  evals: braintrust({
    project: 'knowledge-answers',
    apiKey: process.env.BRAINTRUST_API_KEY,
  }),
});
if (!initialized.ok) throw initialized.error;
```

Install `@viteval/providers` and `@braintrust/api` for this example, and register
the module in Vitest's `test.setupFiles`. Keep `JsonReporter` configured to save a
local copy for the dashboard. It reads local JSON reports, not hosted results.

You can replace the JSON dataset provider with S3 or Google Cloud Storage without
changing the results provider. Each integration's supported operations and
limitations are listed below.

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
pnpm add -D @viteval/providers@rc @prisma/client@^7.10 @prisma/adapter-better-sqlite3@^7.10 better-sqlite3
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

The PostgreSQL option is experimental and is not covered by v1 provider tests.

## Braintrust

```bash
pnpm add -D @viteval/providers@rc @braintrust/api
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
The provider preserves pagination and configuration metadata. Tests use the
official SDK with local HTTP fixtures for dataset pagination and replacement,
experiment creation, result writes, completion metadata, and result pagination.
They do not use a live Braintrust account. Supply your own credentials to use
the provider with your account.

## Langfuse

```bash
pnpm add -D @viteval/providers@rc @langfuse/client @opentelemetry/api @opentelemetry/sdk-trace-base @opentelemetry/exporter-trace-otlp-http
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
self-hosted URLs are supported. Export failures return persistence errors.

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
pnpm add -D @viteval/providers@rc @voltagent/sdk
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

This provider publishes evaluations to VoltOps, including
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

Langfuse and VoltOps tests use official SDKs with local HTTP fixtures, not live
accounts. Keep the JSON reporter configured
for local dashboard inspection alongside hosted persistence.

## S3 and Google Cloud Storage datasets

Object storage providers handle datasets independently of your results backend.
Choose the optional SDK for your bucket:

```bash
# S3
pnpm add -D @viteval/providers@rc @aws-sdk/client-s3

# Google Cloud Storage
pnpm add -D @viteval/providers@rc @google-cloud/storage
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
version intact. Network errors return without automatically replaying writes:
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
