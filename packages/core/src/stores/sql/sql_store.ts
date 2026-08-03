import Store from "../../abstracts/store";
import { randomUUID } from "node:crypto";
import {
  WatcherTypeEnum,
  type LensEntry,
  type PaginationParams,
  type Paginator,
  type QueuedStoreConfig,
} from "../../types/index";
import { nowISO } from "@lensjs/date";
import { lensStream } from "../../utils/event_emitter";
import type { SqlDialect } from "./dialect";
import { createPostgresDialect } from "./postgres";
import { createMysqlDialect } from "./mysql";

const DEFAULT_TABLE = "lens_entries";
const BYTES_IN_GB = 1024 * 1024 * 1024;
const PRUNE_BATCH_SIZE = 1000;
const PRUNE_MAX_ITERATIONS = 1000;

export type SqlStoreConfig = QueuedStoreConfig & {
  /** Which SQL engine to target. */
  dialect: "postgres" | "mysql";
  /** Driver connection string (e.g. `postgres://user:pass@host:5432/db`). */
  connectionString?: string;
  /** A pre-built driver pool to reuse instead of one Lens creates. */
  pool?: unknown;
  /** Table name to store entries in (default `lens_entries`). */
  tableName?: string;
};

/**
 * Production persistence backend for PostgreSQL and MySQL. Holds all query logic
 * and delegates only the dialect-specific SQL fragments to a {@link SqlDialect}.
 * Mirrors `BetterSqliteStore` (cursor + offset pagination, server-side
 * filtering, upsert-with-fresh-cursor for jobs, size-based pruning) but is fully
 * async and uses an explicit auto-increment `seq` column as the cursor (Postgres
 * and MySQL have no rowid).
 */
export default class SqlStore extends Store {
  protected pool: any;
  protected dialect: SqlDialect;
  protected table: string;

  /**
   * Serializes writes so a `DELETE`+`INSERT` upsert is never interleaved with
   * another write to the same id (the batched queue fires saves concurrently),
   * matching SQLite's effectively-serial `INSERT OR REPLACE`.
   */
  private saveChain: Promise<void> = Promise.resolve();

  constructor(config: SqlStoreConfig) {
    super();
    this.storeConfig = config;
    this.dialect =
      config.dialect === "mysql"
        ? createMysqlDialect()
        : createPostgresDialect();
    this.table = config.tableName ?? DEFAULT_TABLE;
  }

  public async initialize() {
    const config = this.storeConfig as SqlStoreConfig;
    this.pool =
      config.pool ??
      (await this.dialect.createPool({
        connectionString: config.connectionString,
      }));

    for (const statement of this.dialect.schema(this.table)) {
      await this.dialect.query(this.pool, statement);
    }

    console.log(`Connected to Lens (${this.dialect.name}) database.`);
  }

  public async truncate() {
    await this.dialect.query(this.pool, `DELETE FROM ${this.table}`);
  }

  public async save(entry: {
    id?: string;
    data: Record<string, any>;
    minimal_data?: Record<string, any>;
    type: WatcherTypeEnum;
    timestamp?: string;
    requestId?: string;
  }) {
    const run = () => this.persist(entry);
    this.saveChain = this.saveChain.then(run, run);
    return this.saveChain;
  }

  private async persist(entry: {
    id?: string;
    data: Record<string, any>;
    minimal_data?: Record<string, any>;
    type: WatcherTypeEnum;
    timestamp?: string;
    requestId?: string;
  }) {
    const id = entry.id ?? randomUUID();
    const createdAt = entry.timestamp ?? nowISO();
    const lensEntryId = entry.requestId || null;
    const minimal = entry.minimal_data ?? {};

    // Upsert = DELETE by id then INSERT, so re-saving the same id (e.g. a job
    // progressing from active -> completed) yields a fresh `seq` for the live
    // feed; unique-id signals never conflict, so the DELETE is a no-op for them.
    await this.dialect.query(this.pool, `DELETE FROM ${this.table} WHERE id = ?`, [
      id,
    ]);
    const seq = await this.dialect.insertSeq(
      this.pool,
      `INSERT INTO ${this.table} (id, data, type, created_at, lens_entry_id, minimal_data) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        this.stringifyData(entry.data),
        entry.type,
        createdAt,
        lensEntryId,
        this.stringifyData(minimal),
      ],
    );

    // Push to the live-tail stream. Prefer the compact minimal_data; fall back
    // to the full data for watchers that don't provide one (e.g. queries).
    try {
      lensStream.emit("entry", {
        cursor: seq,
        entry: {
          id,
          type: entry.type,
          created_at: createdAt,
          lens_entry_id: lensEntryId,
          data: Object.keys(minimal).length ? minimal : entry.data,
        },
      });
    } catch {
      // streaming must never break persistence
    }

    await this.maybePruneDatabase();
  }

  override async getAllQueries<T extends LensEntry[]>(
    pagination: PaginationParams,
  ) {
    return await this.paginate<T>(WatcherTypeEnum.QUERY, pagination);
  }

  override async getAllRequests<T extends Omit<LensEntry, "data">[]>(
    pagination: PaginationParams,
  ) {
    return await this.paginate<T>(WatcherTypeEnum.REQUEST, pagination, false);
  }

  override async getAllCacheEntries<T extends Omit<LensEntry, "data">[]>(
    pagination: PaginationParams,
  ) {
    return await this.paginate<T>(WatcherTypeEnum.CACHE, pagination);
  }

  override async getAllExceptions<T extends Omit<LensEntry, "data">[]>(
    pagination: PaginationParams,
  ) {
    return await this.paginate<T>(WatcherTypeEnum.EXCEPTION, pagination, false);
  }

  override async getAllEmails<T extends Omit<LensEntry, "data">[]>(
    pagination: PaginationParams,
  ) {
    return await this.paginate<T>(WatcherTypeEnum.MAIL, pagination, false);
  }

  public async allByRequestId(
    requestId: string,
    type: WatcherTypeEnum,
    includeFullData = true,
  ) {
    const { rows } = await this.dialect.query(
      this.pool,
      `${this.columns(includeFullData)} FROM ${this.table} WHERE type = ? AND lens_entry_id = ? ORDER BY created_at DESC`,
      [type, requestId],
    );

    return this.mapRows(rows, includeFullData);
  }

  public async paginate<T>(
    type: WatcherTypeEnum,
    params: PaginationParams,
    includeFullData: boolean = true,
  ): Promise<Paginator<T>> {
    // Cursor pagination on the auto-increment `seq` (monotonic with insertion
    // order, indexed). Ordering by `seq DESC` yields newest-first without a
    // COUNT(*) — we fetch one extra row to detect whether more exist. `after`
    // fetches rows NEWER than a cursor (live delta polling); `cursor` fetches
    // rows OLDER than a cursor (infinite scroll); neither = newest page. Any
    // explicit sort (a non-time field, or time ascending) switches to
    // offset-based ordering, which cannot drive the live/delta feed.
    const { cursor, after, perPage, sort, dir } = params;
    const columns = this.columns(includeFullData, true);
    const limit = perPage + 1;
    const filter = this.buildFilterSql(params);
    const cursorAt = (row: any) => Number((row as { __cursor: number }).__cursor);

    const sortField =
      sort && sort !== "time" && /^[A-Za-z0-9_.]+$/.test(sort) ? sort : null;
    const timeAscending = !sortField && dir === "asc";

    if (sortField || timeAscending) {
      const offset = cursor != null && cursor >= 0 ? cursor : 0;
      const dirSql = dir === "asc" ? "ASC" : "DESC";
      const orderBy = sortField
        ? `${this.sortExpr(sortField, params.numericSort)} ${dirSql}, seq DESC`
        : "seq ASC";

      const { rows } = await this.dialect.query(
        this.pool,
        `${columns} FROM ${this.table} WHERE type = ?${filter.sql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
        [type, ...filter.args, limit, offset],
      );

      const hasMore = rows.length > perPage;
      const pageRows = hasMore ? rows.slice(0, perPage) : rows;

      return {
        meta: {
          nextCursor: hasMore ? offset + perPage : null,
          headCursor: null,
          hasMore,
          perPage,
        },
        data: this.mapRows(pageRows, includeFullData) as T,
      };
    }

    let rows: any[];
    if (after != null) {
      ({ rows } = await this.dialect.query(
        this.pool,
        `${columns} FROM ${this.table} WHERE type = ?${filter.sql} AND seq > ? ORDER BY seq DESC LIMIT ?`,
        [type, ...filter.args, after, limit],
      ));
    } else if (cursor != null) {
      ({ rows } = await this.dialect.query(
        this.pool,
        `${columns} FROM ${this.table} WHERE type = ?${filter.sql} AND seq < ? ORDER BY seq DESC LIMIT ?`,
        [type, ...filter.args, cursor, limit],
      ));
    } else {
      ({ rows } = await this.dialect.query(
        this.pool,
        `${columns} FROM ${this.table} WHERE type = ?${filter.sql} ORDER BY seq DESC LIMIT ?`,
        [type, ...filter.args, limit],
      ));
    }

    const hasMore = rows.length > perPage;
    const pageRows = hasMore ? rows.slice(0, perPage) : rows;

    // Rows are DESC: [0] is the newest (head), [last] is the oldest of the page.
    const headCursor = pageRows.length ? cursorAt(pageRows[0]) : (after ?? null);
    const nextCursor =
      after != null
        ? null // delta paging does not drive older pagination
        : hasMore
          ? cursorAt(pageRows[pageRows.length - 1])
          : null;

    return {
      meta: { nextCursor, headCursor, hasMore, perPage },
      data: this.mapRows(pageRows, includeFullData) as T,
    };
  }

  /**
   * Build the additional WHERE clause (search / date-range / field filters) that
   * is AND-ed onto the base `type = ?` predicate. Field names are sanitized and
   * every value is passed as a bound parameter, so this is injection-safe.
   */
  private buildFilterSql({ q, from, to, filters }: PaginationParams): {
    sql: string;
    args: any[];
  } {
    const parts: string[] = [];
    const args: any[] = [];

    if (from) {
      parts.push("created_at >= ?");
      args.push(from);
    }
    if (to) {
      parts.push("created_at <= ?");
      args.push(to);
    }

    for (const f of filters ?? []) {
      if (!/^[A-Za-z0-9_.]+$/.test(f.field)) continue;

      if (f.op === "eq" || f.op === "ne") {
        parts.push(
          `${this.dialect.jsonText("minimal_data", f.field)} ${
            f.op === "eq" ? "=" : "<>"
          } ?`,
        );
        args.push(f.value);
      } else {
        const num = Number(f.value);
        if (!Number.isFinite(num)) continue;
        const opSql = { gt: ">", gte: ">=", lt: "<", lte: "<=" }[f.op];
        parts.push(
          `${this.dialect.jsonNumber("minimal_data", f.field)} ${opSql} ?`,
        );
        args.push(num);
      }
    }

    if (q && q.trim()) {
      parts.push(this.dialect.searchPredicate("minimal_data"));
      args.push(`%${q.trim()}%`);
    }

    return { sql: parts.length ? ` AND ${parts.join(" AND ")}` : "", args };
  }

  /**
   * SQL ORDER BY expression for a `minimal_data` field. `field` is pre-validated
   * to a safe json-path charset by the caller before it reaches here. Text sorts
   * are lower-cased for case-insensitive ordering (parity with SQLite's
   * `COLLATE NOCASE`).
   */
  private sortExpr(field: string, numeric?: boolean): string {
    return numeric
      ? this.dialect.jsonNumber("minimal_data", field)
      : `LOWER(${this.dialect.jsonText("minimal_data", field)})`;
  }

  override async latest<T>(
    { cursor, after, perPage }: PaginationParams,
    includeFullData: boolean = false,
  ): Promise<Paginator<T>> {
    // Same cursor/delta semantics as `paginate`, but across ALL watcher types —
    // the source for the unified live-tail feed and its polling fallback.
    const columns = this.columns(includeFullData, true);
    const limit = perPage + 1;

    let rows: any[];
    if (after != null) {
      ({ rows } = await this.dialect.query(
        this.pool,
        `${columns} FROM ${this.table} WHERE seq > ? ORDER BY seq DESC LIMIT ?`,
        [after, limit],
      ));
    } else if (cursor != null) {
      ({ rows } = await this.dialect.query(
        this.pool,
        `${columns} FROM ${this.table} WHERE seq < ? ORDER BY seq DESC LIMIT ?`,
        [cursor, limit],
      ));
    } else {
      ({ rows } = await this.dialect.query(
        this.pool,
        `${columns} FROM ${this.table} ORDER BY seq DESC LIMIT ?`,
        [limit],
      ));
    }

    const hasMore = rows.length > perPage;
    const pageRows = hasMore ? rows.slice(0, perPage) : rows;
    const cursorAt = (row: any) => Number((row as { __cursor: number }).__cursor);
    const headCursor = pageRows.length ? cursorAt(pageRows[0]) : (after ?? null);
    const nextCursor =
      after != null
        ? null
        : hasMore
          ? cursorAt(pageRows[pageRows.length - 1])
          : null;

    return {
      meta: { nextCursor, headCursor, hasMore, perPage },
      data: this.mapRows(pageRows, includeFullData) as T,
    };
  }

  override async count(type: WatcherTypeEnum): Promise<number> {
    const { rows } = await this.dialect.query(
      this.pool,
      `SELECT COUNT(*) AS count FROM ${this.table} WHERE type = ?`,
      [type],
    );

    return Number((rows?.[0] as { count: number | string })?.count ?? 0);
  }

  override async pruneOlderThan(
    cutoffISO: string,
    type?: WatcherTypeEnum,
  ): Promise<number> {
    const where = type ? "created_at < ? AND type = ?" : "created_at < ?";
    const args = type ? [cutoffISO, type] : [cutoffISO];

    const { rows } = await this.dialect.query(
      this.pool,
      `SELECT COUNT(*) AS count FROM ${this.table} WHERE ${where}`,
      args,
    );
    const count = Number((rows?.[0] as { count: number | string })?.count ?? 0);

    if (count > 0) {
      await this.dialect.query(
        this.pool,
        `DELETE FROM ${this.table} WHERE ${where}`,
        args,
      );
    }

    return count;
  }

  public async find(type: WatcherTypeEnum, id: string) {
    const { rows } = await this.dialect.query(
      this.pool,
      `${this.columns(true)} FROM ${this.table} WHERE id = ? AND type = ? LIMIT 1`,
      [id, type],
    );

    if (!rows.length) {
      return null;
    }

    return this.mapRow(rows[0], true);
  }

  private async maybePruneDatabase() {
    const maxGb = this.storeConfig?.dbMaxSizeGb;
    const pruneGb = this.storeConfig?.dbPruneSizeGb;

    if (!maxGb || !pruneGb) return;

    const maxBytes = maxGb * BYTES_IN_GB;
    const pruneBytes = pruneGb * BYTES_IN_GB;

    if (maxBytes <= 0 || pruneBytes <= 0) return;

    const targetBytes = Math.max(0, maxBytes - pruneBytes);

    let usedBytes = await this.dialect.tableSizeBytes(this.pool, this.table);

    if (usedBytes < maxBytes) return;

    let iterations = 0;
    while (usedBytes > targetBytes && iterations++ < PRUNE_MAX_ITERATIONS) {
      const deletedRows = await this.deleteOldestEntries(PRUNE_BATCH_SIZE);
      if (deletedRows === 0) break;

      const nextBytes = await this.dialect.tableSizeBytes(this.pool, this.table);
      // Stop if the reported size stops dropping (e.g. Postgres bloat retained
      // until VACUUM) to avoid deleting the whole table in a tight loop.
      if (nextBytes >= usedBytes) break;
      usedBytes = nextBytes;
    }
  }

  private async deleteOldestEntries(batchSize: number): Promise<number> {
    const { rows } = await this.dialect.query(
      this.pool,
      `SELECT seq FROM ${this.table} ORDER BY seq ASC LIMIT ?`,
      [batchSize],
    );

    if (!rows.length) return 0;

    const seqs = rows.map((r: any) => Number(r.seq));
    const placeholders = seqs.map(() => "?").join(", ");
    await this.dialect.query(
      this.pool,
      `DELETE FROM ${this.table} WHERE seq IN (${placeholders})`,
      seqs,
    );

    return seqs.length;
  }

  protected mapRow(row: any, includeFullData = true): LensEntry {
    const data = includeFullData
      ? this.dialect.parseJson(row.data)
      : this.dialect.parseJson(row.minimal_data);

    return {
      id: row.id,
      type: row.type,
      created_at: row.created_at,
      lens_entry_id: row.lens_entry_id,
      data: data ?? {},
    };
  }

  protected mapRows(rows: any[], includeFullData = true): LensEntry[] {
    const mappedRows: LensEntry[] = [];

    for (const row of rows) {
      mappedRows.push(this.mapRow(row, includeFullData));
    }

    return mappedRows;
  }

  /**
   * SELECT column list. `withCursor` aliases `seq` to `__cursor` for the
   * pagination helpers (which read `row.__cursor`).
   */
  protected columns(includeFullData = true, withCursor = false): string {
    const base = `id, minimal_data, type, created_at, lens_entry_id${
      includeFullData ? ", data" : ""
    }`;
    return `SELECT ${withCursor ? "seq AS __cursor, " : ""}${base}`;
  }
}
