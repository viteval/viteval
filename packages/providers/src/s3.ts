import type { S3ClientConfig } from '@aws-sdk/client-s3';
import { attemptAsync } from 'massaman/control';
import type { Provider } from '@viteval/core';
import {
  createObjectDatasetProvider,
  type ObjectDatasetOptions,
} from '#/object-storage/datasets';

export interface S3ProviderOptions extends ObjectDatasetOptions {
  bucket: string;
  /** AWS region, credentials, endpoint, path-style addressing, and other standard client settings. */
  clientOptions?: S3ClientConfig;
}

/** Store datasets in S3 with immutable objects and conditional catalog publication.
 * @param options - Existing bucket, namespace, and optional AWS client configuration.
 * @returns A dataset-only provider with lazy SDK loading.
 * @example await initializeProvider({ datasets: s3({ bucket: 'eval-data', clientOptions: { region: 'us-east-1' } }) });
 */
export function s3(options: S3ProviderOptions): Provider {
  return createObjectDatasetProvider({
    ...options,
    name: 's3',
    connect: async () => {
      if (!options.bucket?.trim()) throw new Error('S3 bucket is required');
      const imported = await attemptAsync(() => import('@aws-sdk/client-s3'));
      if (!imported.ok)
        throw new Error(
          'Install @aws-sdk/client-s3 to use the S3 dataset provider',
          { cause: imported.error }
        );
      const sdk = imported.value;
      const reader = new sdk.S3Client(options.clientOptions ?? {});
      // A committed write with a lost response must surface as an error, not be replayed as a new catalog mutation.
      const writer = new sdk.S3Client({
        ...options.clientOptions,
        maxAttempts: 1,
      });
      return {
        read: async (key) => {
          try {
            const object = await reader.send(
              new sdk.GetObjectCommand({ Bucket: options.bucket, Key: key })
            );
            if (!object.Body)
              throw new Error(`S3 object is missing a body: ${key}`);
            const body = await object.Body.transformToString();
            if (!object.ETag)
              throw new Error(`S3 object is missing an ETag: ${key}`);
            return { body, version: object.ETag };
          } catch (error) {
            if (
              error instanceof Error &&
              (error.name === 'NoSuchKey' || error.name === 'NotFound')
            )
              return null;
            throw error;
          }
        },
        write: async (params) => {
          try {
            await writer.send(
              new sdk.PutObjectCommand({
                Bucket: options.bucket,
                Key: params.key,
                Body: params.body,
                ContentType: 'application/json',
                IfMatch: params.version ?? undefined,
                IfNoneMatch: params.version === null ? '*' : undefined,
              })
            );
            return true;
          } catch (error) {
            if (
              error instanceof Error &&
              '$metadata' in error &&
              typeof error.$metadata === 'object' &&
              error.$metadata !== null &&
              'httpStatusCode' in error.$metadata &&
              (error.$metadata.httpStatusCode === 409 ||
                error.$metadata.httpStatusCode === 412)
            )
              return false;
            throw error;
          }
        },
        close: async () => {
          reader.destroy();
          writer.destroy();
        },
      };
    },
  });
}
