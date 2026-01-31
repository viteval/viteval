---
name: eval
description: >-
  This skill should be used when the user wants to "run evals", "run evaluation",
  "execute eval suites", "test model outputs", "run examples", or "check evaluation results".
  Handles LLM evaluation execution from the examples directory with result analysis.
---

# Eval

Run LLM evaluations from the examples directory.

## Usage

`/eval [example-name] [options]`

## Options

| Option | Description |
|--------|-------------|
| `<name>` | Name of the example to run (e.g., `basic`, `custom-scorer`) |
| `--list` | List available examples |
| `--build` | Force rebuild packages before running |

## Instructions

1. **List available examples (if `--list` or no name provided):**
   ```bash
   ls -d examples/*/
   ```
   Show available example directories.

2. **Ensure packages are built:**
   - Check if `packages/core/dist` exists
   - If not, or if `--build` specified, run `pnpm build`

3. **Run the evaluation:**
   ```bash
   # Install dependencies if needed
   [ -d examples/<name>/node_modules ] || pnpm --filter ./examples/<name> install
   # Run the evaluation
   pnpm --filter ./examples/<name> run eval
   ```

4. **Parse and display results:**
   - Look for JSON results in `.viteval/results/` or stdout
   - Display summary metrics (pass/fail, scores, thresholds)
   - Highlight any failing evaluations

5. **Analyze failures:**
   - For failed evals, show the specific scores vs thresholds
   - Identify low-scoring items
   - Suggest potential improvements

## Examples

**List available examples:**
```
/eval --list
→ Available examples:
  - basic
  - custom-scorer
  - dataset-local
```

**Run basic example:**
```
/eval basic
→ pnpm --filter ./examples/basic run eval
```

**Run with rebuild:**
```
/eval basic --build
→ pnpm build
→ pnpm --filter ./examples/basic run eval
```

## Output Format

```
## Evaluation Results: basic

Status: PASSED

### Summary
- Total Suites: 1
- Passed: 1
- Failed: 0

### Suite: Basic Evaluation
Score: 0.85 (threshold: 0.7)
- Mean: 0.85
- Median: 0.88
- Pass Rate: 17/20 (85%)

### Low-Scoring Items
Item #3: score=0.45 (below threshold)
  Input: "What is the capital of France?"
  Expected: "Paris"
  Output: "The capital of France is a city..."
```

Or for failures:

```
## Evaluation Results: custom-scorer

Status: FAILED

### Suite: Custom Scorer Test
Score: 0.52 (threshold: 0.7) FAILED

Aggregated score (0.52) below threshold (0.7).
Consider:
- Reviewing scorer logic
- Adjusting threshold
- Improving task function quality
```

## Related

- **For debugging failures or detailed analysis:** Use the `eval-tester` agent
- **To create new scorers:** Use `/add-scorer` skill
- **To create new datasets:** Use `/add-dataset` skill
