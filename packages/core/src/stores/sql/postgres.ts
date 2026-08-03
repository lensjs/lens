import type { QueryResult, SqlDialect } from "./dialect";
import { parseJsonValue } from "./dialect";

/** Rewrite `?` placeholders to Postgres `$1, $2, …`. */
function toPgSql(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export function createPostgresDialect(): SqlDialect {
  return {
    name: "postgres",

    async createPool(config) {
      const pg: any = await import("pg");
      const Pool = pg.Pool ?? pg.default?.Pool;
      return new Pool(
        config.connectionString
          ? { connectionString: config.connectionString }
          : {},
      );
    },

    async query(pool, sql, params = []): Promise<QueryResult> {
      const res = await pool.query(toPgSql(sql), params);
      return { rows: res.rows ?? [] };
    },

    async insertSeq(pool, sql, params): Promise<number> {
      const res = await pool.query(`${toPgSql(sql)} RETURNING seq`, params);
      return Number(res.rows?.[0]?.seq ?? 0);
    },

    schema(table) {
      return [
        `CREATE TABLE IF NOT EXISTS ${table} (
          seq BIGSERIAL PRIMARY KEY,
          id TEXT NOT NULL UNIQUE,
          minimal_data JSONB,
          data JSONB NOT NULL,
          type TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          lens_entry_id TEXT
        )`,
        `CREATE INDEX IF NOT EXISTS ${table}_type_seq_idx ON ${table} (type, seq DESC)`,
        `CREATE INDEX IF NOT EXISTS ${table}_req_idx ON ${table} (lens_entry_id)`,
      ];
    },

    jsonText(column, field) {
      return `(${column} ->> '${field}')`;
    },

    jsonNumber(column, field) {
      // Extract the leading numeric part so "583 ms" -> 583 without a cast error.
      return `NULLIF(substring(${column} ->> '${field}' from '^[0-9.]+'), '')::double precision`;
    },

    searchPredicate(column) {
      return `${column}::text ILIKE ?`;
    },

    async tableSizeBytes(pool, table) {
      const res = await pool.query(`SELECT pg_total_relation_size($1) AS bytes`, [
        table,
      ]);
      return Number(res.rows?.[0]?.bytes ?? 0);
    },

    parseJson: parseJsonValue,
  };
}
