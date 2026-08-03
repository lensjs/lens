import type { QueryResult, SqlDialect } from "./dialect";
import { parseJsonValue } from "./dialect";

export function createMysqlDialect(): SqlDialect {
  return {
    name: "mysql",

    async createPool(config) {
      const mysql: any = await import("mysql2/promise");
      const create = mysql.createPool ?? mysql.default?.createPool;
      return create(config.connectionString ?? {});
    },

    async query(pool, sql, params = []): Promise<QueryResult> {
      const [result] = await pool.execute(sql, params);
      // SELECT -> an array of rows; INSERT/DELETE -> a ResultSetHeader.
      if (Array.isArray(result)) return { rows: result };
      return { rows: [], insertId: (result as any)?.insertId };
    },

    async insertSeq(pool, sql, params): Promise<number> {
      const [result] = await pool.execute(sql, params);
      return Number((result as any)?.insertId ?? 0);
    },

    schema(table) {
      return [
        `CREATE TABLE IF NOT EXISTS ${table} (
          seq BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          id VARCHAR(255) NOT NULL UNIQUE,
          minimal_data JSON,
          data JSON NOT NULL,
          type VARCHAR(64) NOT NULL,
          created_at VARCHAR(40) NOT NULL,
          updated_at VARCHAR(40),
          lens_entry_id VARCHAR(255),
          INDEX ${table}_type_seq_idx (type, seq),
          INDEX ${table}_req_idx (lens_entry_id)
        )`,
      ];
    },

    jsonText(column, field) {
      return `JSON_UNQUOTE(JSON_EXTRACT(${column}, '$.${field}'))`;
    },

    jsonNumber(column, field) {
      return `CAST(JSON_UNQUOTE(JSON_EXTRACT(${column}, '$.${field}')) AS DECIMAL(30,6))`;
    },

    searchPredicate(column) {
      // MySQL's default collation is case-insensitive.
      return `CAST(${column} AS CHAR) LIKE ?`;
    },

    async tableSizeBytes(pool, table) {
      const [rows] = await pool.execute(
        `SELECT (data_length + index_length) AS bytes FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
        [table],
      );
      return Number((rows as any[])?.[0]?.bytes ?? 0);
    },

    parseJson: parseJsonValue,
  };
}
