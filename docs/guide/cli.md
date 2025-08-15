# CLI Usage

The Viteval CLI provides powerful commands for running evaluations, managing datasets, and more.

## Commands

### Run Evaluations

```bash
# Run all evaluations
viteval

# Run specific files
viteval chat.eval.ts

# Run with glob patterns
viteval "**/*.eval.ts"
```

### Datasets

Easily create and manage datasets for your evaluations.

```bash
# Generate/update all datasets
viteval data

# Generate specific dataset
viteval data --name "user-questions"

# List available datasets
viteval data --list
```

### Debugging

```bash
# Verbose output with stack traces
viteval --verbose
```
