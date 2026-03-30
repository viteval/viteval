import { describe, expect, it } from 'vitest';
import { defineConfig } from './define';

describe('defineConfig', () => {
  it('should create basic config with minimal options', () => {
    const config = defineConfig({
      eval: {
        timeout: 5000,
      },
    });

    expect(config).toBeDefined();
    expect(config.test?.testTimeout).toBe(5000);
    expect(config.test?.environment).toBe('node');
  });

  it('should use default timeout when not specified', () => {
    const config = defineConfig({
      eval: {},
    });

    expect(config.test?.testTimeout).toBe(100_000);
  });

  it('should handle resolve configuration', () => {
    const resolveConf = {
      alias: {
        '#': '/lib',
        '@': '/src',
      },
    };

    const config = defineConfig({
      eval: {},
      resolve: resolveConf,
    });

    expect(config.resolve).toEqual(resolveConf);
  });

  it('should handle deps configuration with optimizer', () => {
    const config = defineConfig({
      deps: {
        interopDefault: true,
        optimizer: {
          enabled: true,
        },
      },
      eval: {},
    });

    expect(config.test?.deps?.optimizer).toBeDefined();
    expect(config.test?.deps?.interopDefault).toBe(true);
  });

  it('should handle deps configuration without optimizer', () => {
    const config = defineConfig({
      deps: {
        interopDefault: false,
      },
      eval: {},
    });

    expect(config.test?.deps?.optimizer).toBeUndefined();
    expect(config.test?.deps?.interopDefault).toBe(false);
  });

  it('should handle plugins configuration', () => {
    const mockPlugin = {
      name: 'test-plugin',
      setup: () => {},
    };

    const config = defineConfig({
      eval: {},
      plugins: [mockPlugin],
    });

    const pluginList = config.plugins as { name: string }[];
    expect(pluginList).toHaveLength(2);
    expect(pluginList[0].name).toBe('viteval');
    expect(pluginList[1].name).toBe('test-plugin');
  });

  it('should include the viteval plugin', () => {
    const config = defineConfig({
      eval: { timeout: 7000 },
    });

    const pluginList = config.plugins as { name: string }[];
    const vitevalEntry = pluginList.find((p) => p.name === 'viteval');
    expect(vitevalEntry).toBeDefined();
  });

  it('should handle undefined deps configuration', () => {
    const config = defineConfig({
      deps: undefined,
      eval: {},
    });

    expect(config.test?.deps).toBeUndefined();
  });

  it('should handle null deps configuration', () => {
    const config = defineConfig({
      eval: {},
      // @ts-expect-error - this is valid
      deps: null,
    });

    expect(config.test?.deps).toBeUndefined();
  });
});
