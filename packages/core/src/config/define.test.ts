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

  it('should handle custom eval configuration', () => {
    const config = defineConfig({
      eval: {
        timeout: 15000,
        reporters: ['json', 'verbose'],
        globals: true,
      },
    });

    expect(config.test?.testTimeout).toBe(15000);
    expect(config.test?.reporters).toEqual(['json', 'verbose']);
    expect(config.test?.globals).toBe(true);
  });

  it('should merge custom config with defaults', () => {
    const config = defineConfig({
      eval: {
        timeout: 8000,
      },
      define: {
        __TEST__: true,
      },
      esbuild: {
        target: 'node18',
      },
    });

    expect(config.test?.testTimeout).toBe(8000);
    expect(config.define?.__TEST__).toBe(true);
    expect(config.esbuild?.target).toBe('node18');
  });

  it('should handle server configuration', () => {
    const serverConfig = {
      port: 3000,
      host: 'localhost',
    };

    const config = defineConfig({
      eval: {},
      server: serverConfig,
    });

    expect(config.test?.server).toEqual(serverConfig);
  });

  it('should handle resolve configuration', () => {
    const resolveConfig = {
      alias: {
        '@': '/src',
        '#': '/lib',
      },
    };

    const config = defineConfig({
      eval: {},
      resolve: resolveConfig,
    });

    expect(config.resolve).toEqual(resolveConfig);
  });

  it('should handle deps configuration with optimizer', () => {
    const config = defineConfig({
      eval: {},
      deps: {
        optimizer: {
          ssr: {
            enabled: true,
          },
          web: {
            enabled: false,
          },
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

    // The provide.config should contain the destructured config (without eval, plugins, resolve, deps, server)
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
      deps: null,
    });

    expect(config.test?.deps).toBeUndefined();
  });
});
