/**
 * Error thrown when a requested provider is not found in the registry.
 */
export class ProviderNotFoundError extends Error {
  /**
   * The provider type that was not found.
   */
  public readonly type: string;

  /**
   * The package name that should be installed.
   */
  public readonly packageName: string;

  constructor(type: string, packageName: string) {
    super(
      `Provider '${type}' not found. Install it with:\n\n  pnpm add ${packageName}\n\nThen import it before using:\n\n  import '${packageName}'\n`
    );
    this.name = 'ProviderNotFoundError';
    this.type = type;
    this.packageName = packageName;
  }
}

/**
 * Error thrown when attempting to register a provider that is already registered.
 */
export class ProviderAlreadyRegisteredError extends Error {
  /**
   * The provider type that is already registered.
   */
  public readonly type: string;

  constructor(type: string) {
    super(`Provider '${type}' is already registered.`);
    this.name = 'ProviderAlreadyRegisteredError';
    this.type = type;
  }
}

/**
 * Error thrown when a provider configuration is invalid.
 */
export class ProviderConfigError extends Error {
  /**
   * The provider type with the configuration error.
   */
  public readonly type: string;

  constructor(type: string, message: string) {
    super(`Provider '${type}' configuration error: ${message}`);
    this.name = 'ProviderConfigError';
    this.type = type;
  }
}
