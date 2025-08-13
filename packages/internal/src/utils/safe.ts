/**
 * A safe result status
 * @param STATUS - The status of the result
 * @param DATA - The data of the result
 */
export type SafeResultStatus<STATUS extends string, DATA> =
  | {
      status: STATUS;
      data: DATA;
    }
  | {
      status: 'error';
      error: Error;
    };

/**
 * Wrap a function in a try/catch block and return a SafeResultStatus
 * @param fn - The function to wrap
 * @returns A SafeResultStatus
 */
export async function wrapSafe<STATUS extends string, DATA>(
  fn: () => Promise<SafeResultStatus<STATUS, DATA>>
): Promise<SafeResultStatus<STATUS, DATA>> {
  try {
    return await fn();
  } catch (error) {
    return { status: 'error', error: error as Error };
  }
}
