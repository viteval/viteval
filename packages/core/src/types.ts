import type * as TF from 'type-fest';

/**
 * A score object, contains the name of the scorer, the score and any additional metadata.
 */
export interface Score {
  name: string;
  score: number | null;
  metadata?: Record<string, unknown>;
}

/**
 * The arguments passed to a scorer, contains the output and expected output and any additional arguments.
 */
export type ScorerArgs<OUTPUT, EXTRA extends Extra> = TF.Merge<
  EXTRA,
  {
    output: OUTPUT;
    expected?: OUTPUT;
  }
>;

/**
 * The aggregation type for a scorer.
 */
export type ScorerAggregationType = 'mean' | 'median' | 'sum';

/**
 * A scorer function, takes the output and expected output and returns a score.
 */
export type Scorer<OUTPUT, EXTRA extends Extra> = (
  args: ScorerArgs<OUTPUT, EXTRA>
) => Score | Promise<Score>;

export type TaskArgs<INPUT, EXTRA extends Extra> = TF.Merge<
  EXTRA,
  {
    input: INPUT;
  }
>;

/**
 * A task function, takes the input and expected output and returns a promise or the output.
 */
export type Task<INPUT, OUTPUT, EXTRA extends Extra> = (
  args: TaskArgs<INPUT, EXTRA>
) => Promise<OUTPUT> | OUTPUT;

/**
 * A data object, contains the input and expected output and any additional arguments.
 */
export type DataItem<
  INPUT = unknown,
  OUTPUT = unknown,
  EXTRA extends Extra = Extra,
> = TF.Merge<
  EXTRA,
  {
    name?: string;
    input: INPUT;
    expected?: OUTPUT;
  }
>;

/**
 * Extra arguments for a data item.
 */
export type Extra = Record<string, unknown>;

/**
 * A data generator function, returns a promise of data objects.
 */
export type DataGenerator<DATA_ITEM extends DataItem = DataItem> =
  () => Promise<DATA_ITEM[]>;

/**
 * A data object, contains the input and expected output and any additional arguments.
 */
export type Data<DATA_ITEM extends DataItem = DataItem> =
  | DATA_ITEM[]
  | DataGenerator<DATA_ITEM>
  | Dataset<DataGenerator<DATA_ITEM>>;

// TODO: Add support for remote storage i.e. S3, Braintrust, etc.
export type DatasetStorage = 'local' | 'memory';

/**
 * A dataset configuration.
 */
export interface DatasetConfig<DATA extends DataGenerator = DataGenerator> {
  /**
   * The storage type of the dataset.
   *
   * @default 'local'
   */
  storage?: DatasetStorage;
  /**
   * The name of the dataset.
   */
  name: string;
  /**
   * The description of the dataset.
   */
  description?: string;
  /**
   * The data generator of the dataset.
   */
  data: DATA;
}

export type DatasetGeneratorConfig = {
  /**
   * Whether to overwrite the dataset if it already exists.
   *
   * @default false
   */
  overwrite?: boolean;
};

export type DatasetGenerator<DATA_FUNC extends DataGenerator> = (
  config?: DatasetGeneratorConfig
) => Promise<Awaited<ReturnType<DATA_FUNC>>>;

/**
 * A dataset, contains the name, storage and data generator.
 */
export type Dataset<DATA_FUNC extends DataGenerator> = TF.SetRequired<
  DatasetConfig<DATA_FUNC>,
  'storage' | 'data'
> & {
  data: DatasetGenerator<DATA_FUNC>;
};

/**
 * An evaluation configuration.
 */
export interface Eval<DATA extends Data> {
  /**
   * The description of the evaluation.
   */
  description?: string;
  /**
   * The data to use for the evaluation.
   */
  data: DATA;
  /**
   * The task to evaluate.
   */
  task: Task<InferDataInput<DATA>, InferDataOutput<DATA>, InferDataExtra<DATA>>;
  /**
   * The scorers to use for the evaluation.
   */
  scorers: Scorer<InferDataOutput<DATA>, InferDataExtra<DATA>>[];
  /**
   * The aggregation type for the evaluation.
   *
   * @default 'mean'
   */
  aggregation?: ScorerAggregationType;
  /**
   * The threshold for the evaluation.
   *
   * @default 1.0
   */
  threshold?: number;
  /**
   * The timeout for the evaluation.
   *
   * @default 10000
   */
  timeout?: number;
}

/**
 * A result object, contains the name of the evaluation, the sum, mean, median and threshold.
 */
export interface EvalResult {
  /**
   * The name of the evaluation.
   */
  name: string;
  /**
   * The sum of the evaluation.
   */
  sum: number;
  /**
   * The median of the evaluation.
   */
  /**
   * The mean of the evaluation.
   */
  mean: number;
  /**
   * The median of the evaluation.
   */
  median: number;
  /**
   * The threshold for the evaluation.
   */
  threshold: number;
  /**
   * The aggregation type for the evaluation.
   */
  aggregation: ScorerAggregationType;
  /**
   * The scores of the evaluation.
   */
  scores: Score[];
  /**
   * The metadata of the evaluation.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Infer the output type of a data object.
 */
export type InferDataOutput<DATA extends Data> = InferDataValue<
  DATA,
  'expected'
>;

/**
 * Infer the input type of a data object.
 */
export type InferDataInput<DATA extends Data> = InferDataValue<DATA, 'input'>;

/**
 * Infer the extra type of a data object.
 */
export type InferDataExtra<DATA extends Data> = Omit<
  ExtractDataItem<DATA>,
  'input' | 'expected' | 'output'
>;

/*
|------------------
| Internals
|------------------
*/

type InferDataValue<
  DATA extends Data,
  KEY extends keyof DataItem,
> = ExtractDataItem<DATA>[KEY];

export type ExtractDataItem<DATA extends Data> = DATA extends DataItem[]
  ? DATA[number]
  : DATA extends DataGenerator<DataItem>
    ? Awaited<ReturnType<DATA>>[number]
    : DATA extends Dataset<DataGenerator<DataItem>>
      ? Awaited<ReturnType<DATA['data']>>[number]
      : never;
