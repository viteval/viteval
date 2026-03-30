import { inject } from 'vitest';
import type { SerializableVitevalConfig } from '#/plugin/viteval-plugin';

/**
 * Get the viteval config from the inject context.
 *
 * Returns the serializable subset of the viteval config that was provided
 * to test workers via the viteval plugin's `configureVitest` hook.
 *
 * @returns The serializable viteval config.
 */
export function getRuntimeConfig(): SerializableVitevalConfig {
	return inject('config');
}
