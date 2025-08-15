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
): Dataset<DATA_FUNC>
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
  // ...
});
```

### `data`

Function that generates or loads the dataset.

**Type**: `() => Promise<DataItem<INPUT, OUTPUT, EXTRA>[]>`  
**Required**: Yes

```ts
// Static data
data: () => [
  { input: "2 + 2", expected: "4" },
  { input: "3 + 3", expected: "6" },
]

// Async data loading
data: async () => {
  const response = await fetch('/api/datasets/math');
  return response.json();
}

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
}
```

### `storage` (optional)

The storage type for the dataset.

**Type**: `DatasetStorage`  
**Default**: `'local'`

```ts
// Local file storage (default)
storage: 'local'

// Memory storage (not persisted)
storage: 'memory'
```

### `description` (optional)

A description of the dataset.

**Type**: `string`

```ts
description: 'Math problems for basic arithmetic evaluation'
```

## DataItem Interface

The data function should return an array of `DataItem` objects:

```ts
type DataItem<
  INPUT = unknown,
  OUTPUT = unknown,
  EXTRA extends Extra = Extra,
> = TF.Merge<
  EXTRA,
  {
    name?: string;
    input: INPUT;
    expected?: OUTPUT;
  }
>;
```

Where `Extra` is:
```ts
type Extra = Record<string, unknown>;
```

## Return Value

Returns a `Dataset<DATA_FUNC>` object:

```ts
type Dataset<DATA_FUNC extends DataGenerator> = TF.SetRequired<
  DatasetConfig<DATA_FUNC>,
  'storage' | 'data'
> & {
  data: DatasetGenerator<DATA_FUNC>;
};
```

The `data` property is a function that can be called with optional configuration:

```ts
type DatasetGenerator<DATA_FUNC extends DataGenerator> = (
  config?: DatasetGeneratorConfig
) => Promise<Awaited<ReturnType<DATA_FUNC>>>;

type DatasetGeneratorConfig = {
  /**
   * Whether to overwrite the dataset if it already exists.
   *
   * @default false
   */
  overwrite?: boolean;
};
```
