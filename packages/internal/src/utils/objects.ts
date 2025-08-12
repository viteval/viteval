import type { SetRequired } from 'type-fest';
import type { PlainObject } from '../types';
import { isObject } from './lang';

/**
 * Check if an object has a key
 *
 * @param obj - The object to check
 * @param key - The key to check
 * @returns True if the object has the key, false otherwise
 */
export function hasKey<T extends PlainObject, K extends string>(
  obj: T,
  key: K
): obj is T & SetRequired<T, K> {
  return isObject(obj) && key in obj;
}
