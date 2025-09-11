# `createScorer()`

The `createScorer()` function allows you to create custom scoring functions for evaluating LLM outputs.

## Import

```ts
import { createScorer } from 'viteval';
```

## Signature

```ts
function createScorer<OUTPUT, EXTRA extends Extra = Extra>(
  config: ScorerConfig<OUTPUT, EXTRA>
): Scorer<OUTPUT, EXTRA>
```

## Parameters

### `config`
- **Type**: `ScorerConfig<OUTPUT, EXTRA>`
- **Required**: Yes
- **Description**: Configuration object for the scorer

## ScorerConfig

```ts
interface ScorerConfig<OUTPUT, EXTRA extends Extra = Extra> {
  name: string;
  score: (
    args: ScorerArgs<OUTPUT, EXTRA>
  ) => Omit<Score, 'name'> | Promise<Omit<Score, 'name'>>;
}
```

### `name`

Unique identifier for the scorer.

**Type**: `string`  
**Required**: Yes

```ts
createScorer({
  name: 'exact-match',
  // ...
});
```

### `score`

Function that calculates the score for an output.

**Type**: `(args: ScorerArgs<OUTPUT, EXTRA>) => Omit<Score, 'name'> | Promise<Omit<Score, 'name'>>`  
**Required**: Yes

The function receives `ScorerArgs` and should return a `Score` object (without the name, as it's automatically added):

```ts
type ScorerArgs<OUTPUT, EXTRA extends Extra> = TF.Merge<
  EXTRA,
  {
    output: OUTPUT;
    expected?: OUTPUT;
  }
>;

interface Score {
  score: number | null;
  metadata?: Record<string, unknown>;
}
```

The function should return a score between 0 and 1, where:
- `1.0` = Perfect score
- `0.0` = Complete failure
- `0.5` = Partial success

## Return Value

Returns a `Scorer<OUTPUT, EXTRA>` function that can be used in evaluations:

```ts
type Scorer<OUTPUT, EXTRA extends Extra> = (
  args: ScorerArgs<OUTPUT, EXTRA>
) => Score | Promise<Score>;
```
