# `createScorer()`

`createScorer()` gives a scoring function a name. Use the returned scorer in
an evaluation's `scorers` array.

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

- **Type**: `ScorerConfig<OUTPUT, EXPECTED, EXTRA>`
- **Required**: Yes
- **Description**: Configuration object for the scorer

## ScorerConfig

```ts
interface ScorerConfig<OUTPUT, EXPECTED = OUTPUT, EXTRA extends Extra = Extra> {
  name: string;
  score: (
    args: ScorerArgs<OUTPUT, EXPECTED, EXTRA>
  ) => ScoreResult | Promise<ScoreResult>;
}

type ScoreResult = Omit<Score, 'name'> & { name?: string };
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

The function that scores a task output against the expected value.

**Type**: `(args: ScorerArgs<OUTPUT, EXPECTED, EXTRA>) => ScoreResult | Promise<ScoreResult>`

**Required**: Yes

The function receives `ScorerArgs` and returns a score with optional metadata.
Viteval adds the scorer name:

```ts
type ScorerArgs<OUTPUT, EXPECTED, EXTRA extends Extra> = EXTRA & {
  output: OUTPUT;
  expected: EXPECTED;
};

interface Score {
  name: string;
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

## Return value

Returns a `Scorer<OUTPUT, EXPECTED, EXTRA>` function that can be used in evaluations:

```ts
type Scorer<OUTPUT, EXPECTED = OUTPUT, EXTRA extends Extra = Extra> = (
  args: ScorerArgs<OUTPUT, EXPECTED, EXTRA>
) => Score | Promise<Score>;
```

`createScorer()` supplies the configured name, overriding any name returned by
the callback. `evaluate()` also passes the original input and additional case
fields to each scorer. Task output and expected values may have different types:

```ts
const correctAnswer = createScorer<{ answer: string }, string>({
  name: 'correct-answer',
  score: ({ output, expected }) => ({
    score: output.answer === expected ? 1 : 0,
  }),
});
```
