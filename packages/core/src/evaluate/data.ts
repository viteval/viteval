import { attempt, attemptAsync, err, isErr, ok } from 'massaman/control';
import type { Result } from 'massaman/control';
import type { RuntimeContext } from '#/config/runtime';
import type { DatasetReference } from '#/provider/registry';
import type {
  Data,
  DataGenerator,
  DataItem,
  Dataset,
  InferDataExtra,
  InferDataInput,
  InferDataOutput,
} from '#/types';

interface ResolveEvaluationDataParams<DATA extends Data> {
  data: DATA;
  context: RuntimeContext;
}

/**
 * Resolve evaluation data using explicitly supplied project dependencies.
 * @param params - Dataset source and dependency context.
 * @returns Loaded cases, or a data-loading failure.
 * @example await resolveEvaluationData({ data: cases, context });
 * @internal
 */
export function resolveEvaluationData<DATA extends Data>(
  params: ResolveEvaluationDataParams<DATA>
): Promise<
  Result<
    DataItem<
      InferDataInput<DATA>,
      InferDataOutput<DATA>,
      InferDataExtra<DATA>
    >[]
  >
>;
export async function resolveEvaluationData({
  data,
  context,
}: ResolveEvaluationDataParams<Data>): Promise<Result<DataItem[]>> {
  if (typeof data === 'function') {
    const resolved = await attemptAsync(async () => data(context));
    if (isErr(resolved)) {
      return resolved;
    }
    return resolveEvaluationData({ data: resolved.value, context });
  }
  if (isDataset(data)) {
    const resolved = await attemptAsync(async () =>
      data.load({ create: true })
    );
    if (isErr(resolved)) {
      return resolved;
    }
    const loaded = resolved.value;
    if (Array.isArray(loaded)) {
      return ok(loaded);
    }
    if (isErr(loaded)) {
      return loaded;
    }
    if (loaded.value === null) {
      return err('Dataset returned no data');
    }
    return ok(loaded.value);
  }
  return ok(data);
}

/**
 * Derive a case label without invoking tasks or scorers.
 * @param dataItem - The case to label.
 * @returns An explicit name, string input, or serialized input label.
 * @example formatEvaluationCaseName({ input: 'hello', expected: 'hello' });
 * @internal
 */
export function formatEvaluationCaseName(dataItem: DataItem): string {
  if (dataItem.name && typeof dataItem.name === 'string') {
    return dataItem.name;
  }
  if (typeof dataItem.input === 'string') {
    return dataItem.input;
  }
  const serialized = attempt(() => JSON.stringify(dataItem.input));
  if (isErr(serialized)) {
    return 'input: [unserializable]';
  }
  return `input: ${serialized.value}`;
}

function isDataset(
  data: Data
): data is Dataset<DataGenerator<DataItem>> | DatasetReference {
  return (
    typeof data === 'object' &&
    data !== null &&
    'load' in data &&
    typeof data.load === 'function'
  );
}
