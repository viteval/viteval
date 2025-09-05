---
"@viteval/internal": patch
"@viteval/core": patch
"@viteval/cli": patch
---

# What's changed?

- Add a wrapper to prevent `resolveConfig` from throwing an error, and add logging for debugging.
- Added a `createVitevalServer` for the `ui` that can be used in a more standard way/approach
