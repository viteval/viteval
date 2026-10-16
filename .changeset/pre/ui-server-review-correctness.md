---
'@viteval/ui': patch
'@viteval/cli': patch
'viteval': patch
---

Keep copied and hand-edited dataset files addressable by their filenames while
preserving canonical provider IDs. Validate tag and tagging POST bodies before
calling storage, and resolve the UI test alias through platform-safe file URLs.
