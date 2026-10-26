# `defineDataset()`

`defineDataset()` wraps a case generator in a reusable dataset. Pass the dataset
to `evaluate()` or save it with `viteval data`.

## Import

```ts
import { defineDataset } from 'viteval/dataset';
```

## Signature

```ts
function defineDataset<DATA_FUNC extends DataGenerator>(
  config: DatasetConfig<DATA_FUNC>
): Dataset<DATA_FUNC>;
```

## Parameters

### `config`

- **Type**: `DatasetConfig<DATA_FUNC>`
- **Required**: Yes
- **Description**: Configuration object for the dataset

## DatasetConfig

```ts
interface DatasetConfig<DATA extends DataGenerator = DataGenerator> {
  /**
   * The storage type of the dataset.
   *
   * @default 'local'
   */
  storage?: DatasetStorage;
  /**
   * The name of the dataset.
   */
  name: string;
  /**
   * The description of the dataset.
   */
  description?: string;
  /**
   * The data generator of the dataset.
   */
  data: DATA;
}
```

### `name`

Unique identifier for the dataset.

**Type**: `string`  
**Required**: Yes

```ts
defineDataset({
  name: 'math-problems',
  data: async () => [{ input: '2 + 2', expected: '4' }],
});
```

### `data`

Function that generates or loads the dataset.

**Type**: `() => Promise<DataItem<INPUT, OUTPUT, EXTRA>[]>`  
**Required**: Yes

```ts
// Static data
data: async () => [
  { input: '2 + 2', expected: '4' },
  { input: '3 + 3', expected: '6' },
];

// Async data loading
data: async () => {
  const response = await fetch('https://example.com/api/datasets/math');
  if (!response.ok)
    throw new Error(`Dataset request failed: ${response.status}`);
  return response.json();
};

// Generated data
data: async () => {
  const problems = [];
  for (let i = 0; i < 1000; i++) {
    const a = Math.floor(Math.random() * 100);
    const b = Math.floor(Math.random() * 100);
    problems.push({
      input: `${a} + ${b}`,
      expected: String(a + b),
    });
  }
  return problems;
};
```

### `storage` (optional)

Choose persisted storage or regenerate cases in memory on each load.

**Type**: `DatasetStorage`  
**Default**: `'local'`

```ts
// Use the configured dataset provider (JSON by default).
storage: 'local';

// Memory storage (not persisted)
storage: 'memory';
```

### `description` (optional)

An optional description of the cases in the dataset.

**Type**: `string`

```ts
description: 'Math problems for basic arithmetic evaluation';
```

## DataItem interface

The generator returns an array of `DataItem` objects:

```ts
type DataItem<
  INPUT = unknown,
  OUTPUT = unknown,
  EXTRA extends Extra = Extra,
> = EXTRA & {
  name?: string;
  input: INPUT;
  expected: OUTPUT;
};
```

`Extra` holds additional case fields:

```ts
type Extra = Record<string, unknown>;
```

## Return value

Returns a `Dataset<DATA_FUNC>` object:

```ts
interface Dataset<DATA_FUNC extends DataGenerator> {
  name: string;
  storage: 'local' | 'memory';
  description?: string;
  exists(): Promise<Result<boolean>>;
  load(options?: {
    create?: boolean;
  }): Promise<Result<Awaited<ReturnType<DATA_FUNC>> | null>>;
  save(options?: { overwrite?: boolean }): Promise<Result<void>>;
}
```

Use `load()` and `save()`; the returned dataset does not expose a `data()` method:

```ts
const saved = await dataset.save({ overwrite: true });
if (!saved.ok) throw saved.error;
const loaded = await dataset.load({ create: true });
if (!loaded.ok) throw loaded.error;
const cases = loaded.value;
```

Local storage uses the configured dataset provider, falling back to JSON under
the current working directory. Generated setup binds that directory to the
selected project. Memory datasets regenerate on load and do not persist. See
[Providers](/guide/providers) for optional backends and serialization rules.

`storage: 'local'` is the persisted-storage mode, not a guarantee of local files.
With an S3 dataset provider configured, the same dataset reads and writes S3.
`evaluate()` loads the saved dataset by name and generates it only when missing.
Use `viteval data --overwrite` to replace saved cases after changing the generator.

## CLI discovery

`viteval data` discovers datasets in `.dataset.*` and `.eval.*` modules. Default
exports, named exports, and non-exported `defineDataset()` calls are supported.
Multiple datasets can share a module. Re-exporting the same dataset does not
generate it twice; distinct objects must have unique names.

Evaluation tasks and scorers are not executed during generation. See
[CLI datasets](/guide/cli#datasets) for patterns, overwrite behavior, and module
import semantics.
