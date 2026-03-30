import { describe, expect, it, vi } from 'vitest';
import type { VitevalConfig } from '#/config/types';
import { vitevalPlugin } from './viteval-plugin';

describe('vitevalPlugin', () => {
	it('should return an object with name "viteval"', () => {
		const plugin = vitevalPlugin({ config: {} });
		expect(plugin.name).toBe('viteval');
	});

	it('should return an object with a configureVitest function', () => {
		const plugin = vitevalPlugin({ config: {} });
		expect(plugin).toHaveProperty('configureVitest');
		expect(typeof plugin.configureVitest).toBe('function');
	});

	describe('configureVitest', () => {
		it('should call project.provide with the eval portion of config', () => {
			const config: VitevalConfig = {
				eval: {
					include: ['**/*.eval.ts'],
					exclude: ['node_modules'],
					timeout: 30_000,
				},
				provider: {
					model: { modelId: 'gpt-4o' } as never,
				},
			};

			const plugin = vitevalPlugin({ config });
			const mockProvide = vi.fn();
			const mockProject = { provide: mockProvide };

			// configureVitest is a Vite plugin hook — call it directly
			(plugin.configureVitest as (ctx: { project: { provide: typeof mockProvide } }) => void)({
				project: mockProject,
			});

			expect(mockProvide).toHaveBeenCalledOnce();
			expect(mockProvide).toHaveBeenCalledWith('config', {
				eval: config.eval,
			});
		});

		it('should not include provider in the serializable config', () => {
			const config: VitevalConfig = {
				eval: { include: ['**/*.eval.ts'] },
				provider: {
					model: { modelId: 'gpt-4o' } as never,
					embeddingModel: { modelId: 'text-embedding-3-small' } as never,
				},
			};

			const plugin = vitevalPlugin({ config });
			const mockProvide = vi.fn();

			(plugin.configureVitest as (ctx: { project: { provide: ReturnType<typeof vi.fn> } }) => void)({
				project: { provide: mockProvide },
			});

			const providedConfig = mockProvide.mock.calls[0][1];
			expect(providedConfig).not.toHaveProperty('provider');
			expect(providedConfig).not.toHaveProperty('model');
		});

		it('should provide undefined eval when config has no eval', () => {
			const config: VitevalConfig = {};

			const plugin = vitevalPlugin({ config });
			const mockProvide = vi.fn();

			(plugin.configureVitest as (ctx: { project: { provide: ReturnType<typeof vi.fn> } }) => void)({
				project: { provide: mockProvide },
			});

			const providedConfig = mockProvide.mock.calls[0][1];
			expect(providedConfig).toEqual({ eval: undefined });
		});
	});
});
