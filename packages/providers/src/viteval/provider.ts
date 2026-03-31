import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { withResult } from '@viteval/internal';
import type { Provider } from '@viteval/core';
import type { PrismaClient } from '@prisma/client';
import { createPrismaClient, resolveSqlitePath } from './db';
import { createDatasetOps } from './datasets';
import { createEvalOps } from './evals';
import type { VitevalProviderOptions } from './types';

/**
 * Create the native viteval provider.
 *
 * Uses SQLite by default (stored at `.viteval/viteval.db`), or PostgreSQL
 * for team/production setups.
 *
 * The Prisma client and domain ops are created lazily on first `initialize()` call,
 * so calling `viteval()` at config time is cheap.
 *
 * @param options - Database configuration options.
 * @returns A Provider backed by Prisma (SQLite or PostgreSQL).
 *
 * @example Default SQLite
 * ```ts
 * import { viteval } from '@viteval/providers';
 *
 * defineConfig({
 *   provider: viteval(),
 * });
 * ```
 *
 * @example PostgreSQL
 * ```ts
 * import { viteval } from '@viteval/providers';
 *
 * defineConfig({
 *   provider: viteval({
 *     database: 'postgres',
 *     url: process.env.DATABASE_URL!,
 *   }),
 * });
 * ```
 */
export function viteval(options: VitevalProviderOptions = {}): Provider {
  const isPostgres = options.database === 'postgres';

  let prisma: PrismaClient | undefined;
  let datasets: ReturnType<typeof createDatasetOps> | undefined;
  let evals: ReturnType<typeof createEvalOps> | undefined;

  function getPrisma(): PrismaClient {
    if (!prisma) {
      throw new Error(
        'Viteval provider not initialized. Call initialize() first.'
      );
    }
    return prisma;
  }

  return {
    close: () =>
      withResult(async () => {
        if (prisma) {
          await prisma.$disconnect();
          prisma = undefined;
          datasets = undefined;
          evals = undefined;
        }
      }),

    get datasets() {
      if (!datasets) {
        datasets = createDatasetOps(getPrisma());
      }
      return datasets;
    },

    get evals() {
      if (!evals) {
        evals = createEvalOps(getPrisma());
      }
      return evals;
    },

    initialize: () =>
      withResult(async () => {
        if (!prisma) {
          prisma = await createPrismaClient(options);
        }

        // Ensure the .viteval directory exists for SQLite
        if (!isPostgres) {
          await mkdir(path.dirname(resolveSqlitePath(options)), {
            recursive: true,
          });
        }

        await ensureSchema(prisma, isPostgres);
      }),

    name: 'viteval',
  };
}

/*
|------------------
| Internals
|------------------
*/

async function ensureSchema(
  prisma: PrismaClient,
  isPostgres: boolean
): Promise<void> {
  // Create tables if they don't exist using raw SQL.
  // This avoids requiring prisma migrate in production.
  const timestamp = isPostgres
    ? 'TIMESTAMP NOT NULL DEFAULT NOW()'
    : 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP';
  const timestampNullable = isPostgres ? 'TIMESTAMP' : 'DATETIME';
  const real = isPostgres ? 'DOUBLE PRECISION' : 'REAL';

  // Wrap in a transaction for atomicity — if the process is killed mid-way,
  // We don't end up with a partially initialized schema.
  await prisma.$transaction([
    prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "datasets" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "version" INTEGER NOT NULL DEFAULT 1,
        "metadata" TEXT NOT NULL DEFAULT '{}',
        "created_at" ${timestamp},
        "updated_at" ${timestamp}
      )
    `),
    prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "datasets_name_key" ON "datasets"("name")
    `),
    prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "dataset_items" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "dataset_id" TEXT NOT NULL,
        "input" TEXT NOT NULL,
        "expected" TEXT NOT NULL,
        "extra" TEXT NOT NULL DEFAULT '{}',
        "ordinal" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "dataset_items_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `),
    prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "dataset_items_dataset_id_idx" ON "dataset_items"("dataset_id")
    `),
    prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "eval_runs" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "dataset_id" TEXT,
        "status" TEXT NOT NULL DEFAULT 'running',
        "config" TEXT NOT NULL DEFAULT '{}',
        "summary" TEXT,
        "tags" TEXT NOT NULL DEFAULT '[]',
        "metadata" TEXT NOT NULL DEFAULT '{}',
        "started_at" ${timestamp},
        "completed_at" ${timestampNullable},
        CONSTRAINT "eval_runs_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `),
    prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "eval_runs_dataset_id_idx" ON "eval_runs"("dataset_id")
    `),
    prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "eval_runs_status_idx" ON "eval_runs"("status")
    `),
    prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "eval_results" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "eval_run_id" TEXT NOT NULL,
        "input" TEXT NOT NULL,
        "expected" TEXT NOT NULL,
        "output" TEXT NOT NULL,
        "scores" TEXT NOT NULL,
        "mean_score" ${real} NOT NULL,
        "median_score" ${real} NOT NULL,
        "sum_score" ${real} NOT NULL,
        "passed" BOOLEAN NOT NULL,
        "duration" INTEGER,
        "metadata" TEXT NOT NULL DEFAULT '{}',
        CONSTRAINT "eval_results_eval_run_id_fkey" FOREIGN KEY ("eval_run_id") REFERENCES "eval_runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `),
    prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "eval_results_eval_run_id_idx" ON "eval_results"("eval_run_id")
    `),
  ]);
}
