import { isPromise } from './lang';

/**
 * A safe result status, that mirror's (not 100% exactly) the Rust native Result type
 *
 * @see https://doc.rust-lang.org/std/result/enum.Result.html
 *
 * @param OK - The type of the ok value
 * @param ERROR - The type of the error value
 */
export type Result<OK, ERROR extends Error = Error> =
  | {
      status: 'ok';
      ok: true;
      result: OK;
    }
  | {
      status: 'error';
      ok: false;
      result: ERROR;
    };

/**
 * Wrap a function in a try/catch block and return a Result
 *
 * @param fn - The function to wrap
 * @returns A Result
 */
export async function withResult<OK, ERROR extends Error = Error>(
  fn: (() => Promise<OK>) | (() => OK)
): Promise<Result<OK, ERROR>> {
  try {
    const fnResult = fn();
    const result = isPromise(fnResult) ? await fnResult : fnResult;
    return { ok: true, result, status: 'ok' };
  } catch (error) {
    return {
      ok: false,
      result: error as ERROR,
      status: 'error',
    };
  }
}
