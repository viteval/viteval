# Langfuse dataset uploads

Viteval records upload completion in Langfuse so a new process can reject partial datasets.

## Remote artifacts

- Dataset metadata `__viteval_initial_upload` stores the initial journal item ID.
- Each upload creates an **archived** item with metadata `__viteval_upload: { schemaVersion: 1, id, state }`.
- The journal starts `pending`. Viteval upserts the same item to `complete` only after every user item upload succeeds.

Reads fetch all item pages before applying user pagination (including `limit: 0`). A missing initial journal, malformed journal, or unfinished upload returns a failed Result. Archived items never appear in returned cases or item counts. Viteval hides the initial-upload metadata key from returned dataset metadata.

External datasets without Viteval markers remain readable. Appending adds a new journal. User item metadata cannot contain `__viteval_upload`; dataset metadata cannot supply `__viteval_initial_upload`.

## Recovery

**Do not mark a failed upload complete by hand.** Its user items may be only partially persisted.

Inspect the dataset ID in the error, remove the incomplete dataset in Langfuse, then recreate it from the source cases. The supported SDK does not expose safe dataset rollback/deletion through this adapter. Retrying creation under an existing incomplete name fails rather than adopting its cases.
