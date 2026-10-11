import { z } from 'zod';

type JsonData<T> = unknown extends T
  ? z.infer<ReturnType<typeof z.json>>
  : T extends readonly (infer Item)[]
    ? JsonData<Item>[]
    : T extends object
      ? { [Key in keyof T]: JsonData<T[Key]> }
      : T;

/**
 * Validates filesystem JSON while retaining the SDK's known response fields.
 * @param value - SDK data whose arbitrary payload fields are typed as unknown.
 * @returns Validated JSON with serializable payload types for Start transport.
 * @example toSerializable({ data: { input: 'question' } });
 */
export function toSerializable<T>(value: T): JsonData<T> {
  const json: unknown = JSON.parse(JSON.stringify(value));
  return z.json().parse(json) as JsonData<T>;
}
