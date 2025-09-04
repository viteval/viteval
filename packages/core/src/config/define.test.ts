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

    expect(config.test?.testTimeout).toBe(100000);
  });

  it('should handle resolve configuration', () => {
    const resolveConf = {
      alias: {
        '@': '/src',
        '#': '/lib',
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
      eval: {},
      deps: {
        optimizer: {
          enabled: true,
        },
        interopDefault: true,
      },
    });

    expect(config.test?.deps?.optimizer).toBeDefined();
    expect(config.test?.deps?.interopDefault).toBe(true);
  });

  it('should handle deps configuration without optimizer', () => {
    const config = defineConfig({
      eval: {},
      deps: {
        interopDefault: false,
      },
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

    expect(config.plugins).toEqual([mockPlugin]);
  });

  it('should set config in test provide', () => {
    const customConfig = {
      eval: { timeout: 7000 },
      custom: { value: 'test' },
    };

    const config = defineConfig(customConfig);

    // @ts-expect-error - this is valid
    expect(config.test?.provide?.config).toEqual({ custom: { value: 'test' } });
  });

  it('should handle undefined deps configuration', () => {
    const config = defineConfig({
      eval: {},
      deps: undefined,
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
