/**
 * Install dataset discovery before the internal engine imports user modules.
 * @returns JavaScript source for a per-worker setup module and its cleanup helpers.
 * @example const source = createDatasetBootstrap();
 */
export function createDatasetBootstrap(): string {
  return `import { AsyncLocalStorage } from 'node:async_hooks';
import { afterAll } from 'vitest';

const previousDiscovery = globalThis.__viteval_datasetDiscovery;
let candidates = [];
const modules = new Map();
const owners = new AsyncLocalStorage();
const completed = new Set();
let nextOwner = 0;
const discovery = {
  register(value) {
    candidates = [...candidates, { value, owner: owners.getStore() }];
  },
  startModule() {
    const owner = nextOwner++;
    owners.enterWith(owner);
    return owner;
  },
  finishModule(file, checkpoint) {
    completed.add(checkpoint);
    modules.set(file, candidates.filter(item => item.owner === checkpoint).map(item => item.value));
  },
};
globalThis.__viteval_datasetDiscovery = discovery;
afterAll(restoreDiscovery);

export function takeCandidates() {
  const values = candidates.filter(item => item.owner === undefined || completed.has(item.owner)).map(item => item.value);
  candidates = [];
  return values;
}

export function moduleCandidates(file) {
  return modules.get(file) ?? [];
}

export function restoreDiscovery() {
  owners.disable();
  if (globalThis.__viteval_datasetDiscovery === discovery) {
    globalThis.__viteval_datasetDiscovery = previousDiscovery;
  }
}
`;
}

/**
 * Capture successful matched imports, including modules cached by setup files.
 * @param params - Transformed module source, absolute file path, and unique checkpoint name.
 * @returns Module source with discovery checkpoints around its execution.
 * @example instrumentDatasetModule({ code: source, file: '/app/questions.eval.ts', checkpoint: '__datasetCheckpoint' });
 */
export function instrumentDatasetModule({
  code,
  file,
  checkpoint,
}: {
  code: string;
  file: string;
  checkpoint: string;
}): string {
  const start = `const ${checkpoint} = globalThis.__viteval_datasetDiscovery?.startModule?.();\n`;
  const finish = `\nglobalThis.__viteval_datasetDiscovery?.finishModule?.(${JSON.stringify(file)}, ${checkpoint});\n`;
  if (code.startsWith('#!')) {
    const lineEnd = code.indexOf('\n');
    if (lineEnd === -1) return `${code}\n${start}${finish}`;
    return `${code.slice(0, lineEnd + 1)}${start}${code.slice(lineEnd + 1)}${finish}`;
  }
  return `${start}${code}${finish}`;
}

/**
 * Match native file paths to Vite's POSIX module identifiers.
 * @param file - Native or POSIX module path.
 * @returns A consistently separated module identifier.
 * @example normalizeDatasetPath('C:\\app\\questions.eval.ts');
 */
export function normalizeDatasetPath(file: string): string {
  return file.replaceAll('\\', '/');
}
