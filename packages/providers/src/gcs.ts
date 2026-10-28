import type { StorageOptions } from '@google-cloud/storage';
import { attemptAsync } from 'massaman/control';
import type { Provider } from '@viteval/core';

declare module '@viteval/core' {
  interface ProviderRegistry {
    gcs: { datasets: true };
  }
}
import {
  createObjectDatasetProvider,
  type ObjectDatasetOptions,
} from '#/object-storage/datasets';

export interface GcsProviderOptions extends ObjectDatasetOptions {
  bucket: string;
  /** Standard project, Application Default Credentials, and client endpoint settings. */
  clientOptions?: StorageOptions;
}

/** Store datasets in Google Cloud Storage with generation-conditional catalog publication.
 * @param options - Existing bucket, namespace, and optional Google client configuration.
 * @returns A dataset-only provider with lazy SDK loading.
 * @example defineConfig({ providers: [gcs({ bucket: 'eval-data' })], dataset: { providers: ['gcs'] } });
 */
export function gcs(options: GcsProviderOptions): Provider {
  return createObjectDatasetProvider({
    ...options,
    connect: async () => {
      if (!options.bucket?.trim()) throw new Error('GCS bucket is required');
      const imported = await attemptAsync(
        () => import('@google-cloud/storage')
      );
      if (!imported.ok)
        throw new Error(
          'Install @google-cloud/storage to use the GCS dataset provider',
          { cause: imported.error }
        );
      const reader = new imported.value.Storage(
        options.clientOptions ?? {}
      ).bucket(options.bucket);
      const writer = new imported.value.Storage({
        ...options.clientOptions,
        retryOptions: {
          ...options.clientOptions?.retryOptions,
          autoRetry: false,
          maxRetries: 0,
        },
      }).bucket(options.bucket);
      return {
        read: async (key) => {
          try {
            const stream = reader.file(key).createReadStream();
            let version: string | undefined;
            // Capture the token from the same checksum-validated download; SDK File generation options coerce strings to numbers.
            stream.on('response', (response: unknown) => {
              if (
                typeof response !== 'object' ||
                response === null ||
                !('headers' in response)
              )
                return;
              const headers = response.headers;
              if (
                typeof headers !== 'object' ||
                headers === null ||
                !('x-goog-generation' in headers)
              )
                return;
              if (typeof headers['x-goog-generation'] === 'string')
                version = headers['x-goog-generation'];
            });
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
              if (!(chunk instanceof Uint8Array))
                throw new Error(`Invalid GCS download body: ${key}`);
              chunks.push(Buffer.from(chunk));
            }
            if (!version || !/^\d+$/.test(version))
              throw new Error(
                `GCS download is missing a usable generation: ${key}`
              );
            return { body: Buffer.concat(chunks).toString('utf8'), version };
          } catch (error) {
            if (isStatus({ error, status: 404 })) return null;
            throw error;
          }
        },
        write: async (params) => {
          try {
            // File.save() may delete an upload after a checksum error; carry the old generation onto that cleanup too.
            await writer
              .file(params.key, {
                preconditionOpts: { ifGenerationMatch: params.version ?? 0 },
              })
              .save(params.body, {
                resumable: false,
                contentType: 'application/json',
                preconditionOpts: { ifGenerationMatch: params.version ?? 0 },
              });
            return true;
          } catch (error) {
            if (isStatus({ error, status: 412 })) return false;
            throw error;
          }
        },
        close: async () => {},
      };
    },
    name: 'gcs',
  });
}

function isStatus(params: { error: unknown; status: number }): boolean {
  return (
    params.error instanceof Error &&
    'code' in params.error &&
    params.error.code === params.status
  );
}
