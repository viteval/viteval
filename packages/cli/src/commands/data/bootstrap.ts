/**
 * Install dataset discovery before native Vitest executes user setup files.
 * @returns JavaScript source for a per-worker setup module and its cleanup helpers.
 * @example const source = createDatasetBootstrap();
 */
export function createDatasetBootstrap(): string {
  return `import { afterAll } from 'vitest';

const previousDiscovery = globalThis.__viteval_datasetDiscovery;
let candidates = [];
const modules = new Map();
const discovery = {
  register(value) {
    candidates = [...candidates, value];
  },
  startModule() {
    return candidates.length;
  },
  finishModule(file, checkpoint) {
    modules.set(file, candidates.slice(checkpoint));
  },
};
globalThis.__viteval_datasetDiscovery = discovery;
afterAll(restoreDiscovery);

export function takeCandidates() {
  const values = candidates;
  candidates = [];
  return values;
}

export function moduleCandidates(file) {
  return modules.get(file) ?? [];
}

export function restoreDiscovery() {
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
