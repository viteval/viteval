# `defineDataset()`

The `defineDataset()` function creates reusable datasets that can be shared across multiple evaluations.

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
  const response = await fetch('/api/datasets/math');
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

The storage type for the dataset.

**Type**: `DatasetStorage`  
**Default**: `'local'`

```ts
// Local file storage (default)
storage: 'local';

// Memory storage (not persisted)
storage: 'memory';
```

### `description` (optional)

A description of the dataset.

**Type**: `string`

```ts
description: 'Math problems for basic arithmetic evaluation';
```

## DataItem Interface

The data function should return an array of `DataItem` objects:

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

Where `Extra` is:

```ts
type Extra = Record<string, unknown>;
```

## Return Value

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

## CLI discovery

`viteval data` discovers datasets in `.dataset.*` and `.eval.*` modules. Default
exports, named exports, and non-exported `defineDataset()` calls are supported.
Multiple datasets can share a module. Re-exporting the same dataset does not
generate it twice; distinct objects must have unique names.

Evaluation tasks and scorers are not executed during generation. See
[CLI datasets](/guide/cli#datasets) for patterns, overwrite behavior, and module
import semantics.
