import { z } from 'zod';

export const DATASET_FILE_SCHEMA = z.object({
  schemaVersion: z.literal(1).optional(),
  id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  version: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  timestamp: z.string().optional(),
  data: z.array(
    z.object({ input: z.unknown(), expected: z.unknown() }).passthrough()
  ),
});

export type DatasetFile = z.infer<typeof DATASET_FILE_SCHEMA>;
