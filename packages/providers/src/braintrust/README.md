# Braintrust dataset uploads

Viteval stages new datasets and records each mutation in a durable upload journal.

## Remote artifacts

- New datasets use the reserved staging name `__viteval_upload_<uuid>`.
- Dataset metadata `__viteval_initial_upload` identifies the initial journal event. Metadata uses PATCH because the supported SDK does not accept it on create.
- Each upload inserts an event with metadata `__viteval_upload: { schemaVersion: 1, id, state }`. It starts `pending` and is upserted to `complete` only after the data request succeeds.
- Viteval publishes the requested dataset name only after the initial upload completes.

Journal events remain visible in Braintrust. Viteval excludes them from returned cases and counts and hides the initial-upload metadata key. Replacement deletes only user events, preserving every upload journal so another failed mutation cannot disappear.

Reads fetch every event page before applying user pagination (including `limit: 0`). Staging datasets, missing initial journals, malformed journals, and pending uploads return failed Results. A staging orphan does not resolve under the originally requested name.

External datasets remain readable. Appends and replacements add journals. User case metadata cannot contain `__viteval_upload`; user dataset metadata and names cannot overwrite the reserved initial-upload key or staging namespace.

## Recovery

Creation failures attempt dataset deletion. If cleanup fails, the Result identifies the orphan ID; delete that dataset before retrying. Failed append/replacement leaves the published dataset blocked. Delete and recreate it from source cases, or restore a known-complete dataset in Braintrust.

**Do not delete journals or manually set them complete** to make reads pass. The associated user mutation may have persisted only partially. Create retries validate existing published datasets and reject incomplete ones rather than adopting their cases.
