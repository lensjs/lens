export type SqlDialectName = "postgres" | "mysql";

export type QueryResult = { rows: any[]; insertId?: number };

/**
 * Encapsulates everything that differs between SQL engines so `SqlStore` can be
 * written once. All store SQL is authored with `?` placeholders; `query` adapts
 * them (and the result shape) per driver.
 */
export interface SqlDialect {
  readonly name: SqlDialectName;

  /** Build a connection pool from config (dynamically imports the driver). */
  createPool(config: { connectionString?: string }): Promise<any>;

  /** Run a `?`-placeholder query, normalizing the driver's result. */
  query(pool: any, sql: string, params?: any[]): Promise<QueryResult>;

  /** Run an INSERT and return the new `seq` (cursor) value. */
  insertSeq(pool: any, sql: string, params: any[]): Promise<number>;

  /** CREATE TABLE / INDEX statements for the entries table. */
  schema(table: string): string[];

  /** SQL expression selecting a `minimal_data` field as text (field pre-validated). */
  jsonText(column: string, field: string): string;

  /** SQL expression selecting a `minimal_data` field as a number (leading-numeric tolerant). */
  jsonNumber(column: string, field: string): string;

  /** Case-insensitive substring predicate over a JSON column (`<expr> LIKE ?`). */
  searchPredicate(column: string): string;

  /** Approximate on-disk size of the table in bytes (for pruning). */
  tableSizeBytes(pool: any, table: string): Promise<number>;

  /** Parse a JSON column value (object passthrough; JSON.parse a string). */
  parseJson(value: any): any;
}

/** Shared JSON-column parser used by both dialects. */
export function parseJsonValue(value: any): any {
  if (value == null) return value;
  return typeof value === "string" ? JSON.parse(value) : value;
}
