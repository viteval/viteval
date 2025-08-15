# CLI Usage

The Viteval CLI provides powerful commands for running evaluations, managing datasets, and more.

## Basic Commands

### Run Evaluations

```bash
# Run all evaluations
viteval

# Run specific files
viteval src/evals/chat.eval.ts

# Run with glob patterns
viteval "src/evals/**/*.eval.ts"
```

### Watch Mode

Automatically re-run evaluations when files change:

```bash
# Watch all evaluation files
viteval --watch

# Watch specific patterns
viteval --watch "src/evals/**/*.eval.ts"
```

### Dataset Commands

```bash
# Generate/update all datasets
viteval data

# Generate specific dataset
viteval data --name "user-questions"

# List available datasets
viteval data --list
```

## Command Options

### Execution Control

```bash
# Stop on first failure
viteval --bail

# Set maximum parallel evaluations
viteval --max-concurrency 3

# Set timeout (in milliseconds)
viteval --timeout 60000

# Run in sequence (no parallelization)
viteval --no-parallel
```

### Output Control

```bash
# Verbose output
viteval --verbose

# JSON output
viteval --reporter json

# Silent mode (only errors)
viteval --silent

# Show only failures
viteval --only-failures
```

### Filtering

```bash
# Run evaluations matching pattern
viteval --grep "chat"

# Exclude evaluations matching pattern  
viteval --exclude "draft"

# Run specific evaluation by name
viteval --name "Color detection"
```

## Configuration

### Using Config Files

```bash
# Use specific config file
viteval --config viteval.prod.config.ts

# Override config options
viteval --config viteval.config.ts --timeout 30000
```

### Environment Variables

```bash
# Set environment
NODE_ENV=production viteval

# Pass API keys
OPENAI_API_KEY=sk-... viteval

# Multiple environment variables
OPENAI_API_KEY=sk-... ANTHROPIC_API_KEY=sk-... viteval
```

## Advanced Usage

### Running Subsets

```bash
# Run only fast evaluations (custom tag)
viteval --grep "fast"

# Run everything except slow evaluations
viteval --exclude "slow"

# Run specific category
viteval src/evals/chat/**/*.eval.ts
```

### CI/CD Integration

```bash
# Exit with non-zero code on any failure
viteval --bail

# Generate JSON report for processing
viteval --reporter json > results.json

# Run with specific timeout for CI
viteval --timeout 120000 --max-concurrency 2
```

### Debugging

```bash
# Verbose output with stack traces
viteval --verbose --debug

# Run single evaluation for debugging
viteval --name "My evaluation" --verbose

# Run with no timeout for debugging
viteval --timeout 0
```

## Working with Datasets

### Generate Datasets

```bash
# Generate all datasets
viteval data

# Generate specific dataset
viteval data --name "math-problems"

# Force regeneration (ignore cache)
viteval data --force

# Preview dataset without saving
viteval data --name "questions" --dry-run
```

### Dataset Information

```bash
# List all datasets
viteval data --list

# Show dataset details
viteval data --info --name "user-questions"

# Validate datasets
viteval data --validate
```

## Examples

### Development Workflow

```bash
# Start development with watch mode
viteval --watch --verbose

# In another terminal, work on your code
# Evaluations will re-run automatically when files change
```

### CI Pipeline

```bash
#!/bin/bash
# .github/workflows/evals.yml

# Generate datasets if needed
viteval data --validate || viteval data

# Run evaluations
viteval --reporter json --bail --timeout 300000 > eval-results.json

# Process results
node scripts/process-results.js eval-results.json
```

### Local Testing

```bash
# Quick test of specific evaluation
viteval --name "Chat responses" --verbose

# Test with different model configuration
MODEL=gpt-3.5-turbo viteval src/evals/chat.eval.ts

# Run subset for rapid iteration
viteval --grep "unit" --max-concurrency 1
```

## Exit Codes

- `0`: All evaluations passed
- `1`: One or more evaluations failed
- `2`: Configuration or setup error
- `3`: Runtime error (timeout, crash, etc.)

## Tips and Tricks

### Performance Optimization

```bash
# Maximize parallelization for fast execution
viteval --max-concurrency 10

# Use fewer workers for memory-constrained environments
viteval --max-concurrency 2

# Profile execution time
time viteval --verbose
```

### Output Redirection

```bash
# Save detailed output to file
viteval --verbose > evaluation-log.txt 2>&1

# Save only JSON results
viteval --reporter json > results.json

# Separate stdout and stderr
viteval > results.txt 2> errors.txt
```

### Integration with Other Tools

```bash
# Use with jq for JSON processing
viteval --reporter json | jq '.summary'

# Count failures
viteval --reporter json | jq '.summary.failed'

# Extract specific results
viteval --reporter json | jq '.results[] | select(.passed == false)'
```