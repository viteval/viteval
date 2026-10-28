declare global {
  var __viteval_runtime: import('./config/runtime').ProjectRuntime | undefined;
  var __viteval_datasetDiscovery:
    | { register: (dataset: unknown) => void }
    | undefined;
}

export {};
