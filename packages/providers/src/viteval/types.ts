/**
 * Configuration for the native viteval provider.
 */
export type VitevalProviderOptions =
  | VitevalJsonOptions
  | VitevalSqliteOptions
  | VitevalPostgresOptions;

/** Local JSON configuration (default). */
export interface VitevalJsonOptions {
  database?: 'json';
  root?: string;
}

/**
 * SQLite configuration (default).
 */
export interface VitevalSqliteOptions {
  /**
   * Database type.
   *
   * @default 'sqlite'
   */
  database?: 'sqlite';
  /**
   * Path to the SQLite database file.
   *
   * @default '.viteval/viteval.db'
   */
  path?: string;
}

/**
 * PostgreSQL configuration for teams/production.
 */
export interface VitevalPostgresOptions {
  /**
   * Database type.
   */
  database: 'postgres';
  /**
   * PostgreSQL connection URL.
   */
  url: string;
}
