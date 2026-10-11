import { pathToFileURL } from 'node:url';

/**
 * Build a native Vitest module that generates datasets inside their project worker.
 * @param params - Dataset files, storage root, and overwrite policy.
 * @returns JavaScript source for the temporary test module.
 * @example createDatasetWorker({ files: ['questions.dataset.ts'], root: process.cwd(), overwrite: false });
 */
export function createDatasetWorker({
  files,
  root,
  overwrite,
}: {
  files: readonly string[];
  root: string;
  overwrite: boolean;
}): string {
  const datasets = files.map((file) => ({
    name: file,
    file: pathToFileURL(file).href,
  }));
  return `import { test, recordArtifact } from 'vitest';
import { createJsonProvider, getDatasetProvider, initializeProvider } from 'viteval/provider';

if (!getDatasetProvider()) {
  const initialized = await initializeProvider({ datasets: createJsonProvider({ root: ${JSON.stringify(root)} }) });
  if (!initialized.ok) throw initialized.error;
}

const discovered = new Map();
const conflicts = new Set();
const failures = [];
const previousDiscovery = globalThis.__viteval_datasetDiscovery;
let candidates = [];
globalThis.__viteval_datasetDiscovery = {
  register(value) {
    if (isDataset(value)) candidates = [...candidates, value];
  },
};

try {
  for (const item of ${JSON.stringify(datasets)}) {
    candidates = [];
    try {
      const module = await import(item.file);
      for (const value of Object.values(module)) {
        if (isDataset(value)) candidates = [...candidates, value];
      }
      if (!candidates.length && /\\.dataset\\.[^.]+$/.test(item.name)) {
        throw new Error('Dataset modules must define or export a defineDataset() result');
      }
      for (const dataset of candidates) {
        const existing = discovered.get(dataset.name);
        if (existing && existing !== dataset) conflicts.add(dataset.name);
        else discovered.set(dataset.name, dataset);
      }
    } catch (error) {
      failures.push({ name: item.name, error });
    }
  }
} finally {
  globalThis.__viteval_datasetDiscovery = previousDiscovery;
}

for (const { name, error } of failures) {
  test('viteval dataset: ' + name, { meta: { vitevalDataset: true } }, async ({ task }) => {
    await recordArtifact(task, { type: 'viteval:dataset', name, kind: 'failed', error: error instanceof Error ? error.message : String(error) });
    throw error;
  });
}

if (!discovered.size && !failures.length) {
  test('viteval dataset: discovery', { meta: { vitevalDataset: true } }, () => {
    throw new Error('No datasets defined in the matched modules');
  });
}

for (const [name, dataset] of discovered) {
  test('viteval dataset: ' + name, { concurrent: true, meta: { vitevalDataset: true } }, async ({ task }) => {
  try {
    if (conflicts.has(name)) {
      throw new Error('Distinct datasets share the same name: ' + name);
    }
    if (!${JSON.stringify(overwrite)}) {
      const exists = await dataset.exists();
      if (!exists.ok) throw exists.error;
      if (exists.value) {
        await recordArtifact(task, { type: 'viteval:dataset', name, kind: 'skipped' });
        return;
      }
    }
    const saved = dataset.storage === 'memory' ? await dataset.load({ create: true }) : await dataset.save({ overwrite: ${JSON.stringify(overwrite)} });
    if (!saved.ok) throw saved.error;
    await recordArtifact(task, { type: 'viteval:dataset', name, kind: 'generated' });
  } catch (error) {
    await recordArtifact(task, { type: 'viteval:dataset', name, kind: 'failed', error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
  });
}

function isDataset(value) {
  return value !== null && typeof value === 'object' && typeof value.name === 'string' && typeof value.exists === 'function' && typeof value.save === 'function' && typeof value.load === 'function' && (value.storage === 'local' || value.storage === 'memory');
}
`;
}
