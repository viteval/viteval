/**
 * Resolves a promise or returns the value.
 */
export async function resolve<T>(value: PromiseLike<T> | T): Promise<T> {
  if (value instanceof Promise) {
    return await value;
  }
  return new Promise<T>((resolve) => resolve(value));
}
