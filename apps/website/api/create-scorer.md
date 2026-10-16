# `createScorer()`

The `createScorer()` function allows you to create custom scoring functions for evaluating LLM outputs.

## Import

```ts
import { createScorer } from 'viteval';
```

## Signature

```ts
function createScorer<OUTPUT, EXPECTED = OUTPUT, EXTRA extends Extra = Extra>(
  config: ScorerConfig<OUTPUT, EXPECTED, EXTRA>
): Scorer<OUTPUT, EXPECTED, EXTRA>;
```

## Parameters

### `config`

- **Type**: `ScorerConfig<OUTPUT, EXTRA>`
- **Required**: Yes
- **Description**: Configuration object for the scorer

## ScorerConfig

```ts
interface ScorerConfig<OUTPUT, EXPECTED = OUTPUT, EXTRA extends Extra = Extra> {
  name: string;
  score: (
    args: ScorerArgs<OUTPUT, EXPECTED, EXTRA>
  ) => Omit<Score, 'name'> | Promise<Omit<Score, 'name'>>;
}
```

### `name`

Unique identifier for the scorer.

**Type**: `string`  
**Required**: Yes

```ts
createScorer<string>({
  name: 'exact-match',
  score: ({ output, expected }) => ({ score: output === expected ? 1 : 0 }),
});
```

### `score`

Function that calculates the score for an output.

**Type**: `(args: ScorerArgs<OUTPUT, EXTRA>) => Omit<Score, 'name'> | Promise<Omit<Score, 'name'>>`  
**Required**: Yes

The function receives `ScorerArgs` and should return a `Score` object (without the name, as it's automatically added):

```ts
type ScorerArgs<OUTPUT, EXPECTED, EXTRA extends Extra> = EXTRA & {
  output: OUTPUT;
  expected: EXPECTED;
};

interface Score {
  score: number | null;
  metadata?: Record<string, unknown>;
}
```

Use normalized scores between 0 and 1 for the usual mean/median gates. V1 accepts
any finite score; null counts as zero. Non-finite scores and scorer exceptions
fail the case. Typical normalized scores mean:

- `1.0` = Perfect score
- `0.0` = Complete failure
- `0.5` = Partial success

## Return Value

Returns a `Scorer<OUTPUT, EXTRA>` function that can be used in evaluations:

```ts
type Scorer<OUTPUT, EXPECTED = OUTPUT, EXTRA extends Extra = Extra> = (
  args: ScorerArgs<OUTPUT, EXPECTED, EXTRA>
) => Score | Promise<Score>;
```
