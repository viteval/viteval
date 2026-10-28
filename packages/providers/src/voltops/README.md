# VoltOps dataset uploads

Viteval validates durable completion controls before returning a managed dataset's latest version.

## Remote artifacts

- Managed dataset descriptions start with `viteval:dataset-upload:v1\n`, followed by JSON containing the user description. Viteval returns the decoded description.
- Each version contains two visible control rows labeled `viteval:upload-control`.
- Their `extra.__viteval_upload` values contain `{ schemaVersion: 1, id, state }`: one `pending`, one `complete`, with the same upload ID.
- Viteval writes the pending row before user cases and the complete row only after all case uploads succeed. Even empty datasets receive both rows.

Reads fetch all item pages before applying user pagination (including `limit: 0`). Missing or malformed controls reject the version through a failed Result. Control rows never appear in Viteval cases or item counts; the VoltOps console's raw count includes them. User case metadata cannot contain `__viteval_upload`.

External datasets remain readable. **Unmanaged append is rejected** because the supported SDK cannot durably mark an existing dataset before creating its version. Create a new Viteval-managed dataset instead. Managed append copies existing user cases into a new version with its own controls.

## Recovery

Inspect the dataset/version IDs in the error. Remove the incomplete version in the VoltOps console to restore a known-complete previous version, or remove and recreate the dataset from source cases. The adapter cannot safely roll back or delete through the supported SDK. Never manufacture a complete control row to bypass validation.

Preserve the managed description prefix and control rows during console edits. Retrying creation under an existing incomplete name fails rather than adopting partial cases.
