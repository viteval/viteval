import { z } from 'zod';

export const DATASET_FILE_SCHEMA = z.strictObject({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.number().int().positive(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  data: z.array(
    z.object({ input: z.unknown(), expected: z.unknown() }).passthrough()
  ),
});

export type DatasetFile = z.infer<typeof DATASET_FILE_SCHEMA>;
