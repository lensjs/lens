import Store from "../abstracts/store";
import { randomUUID } from "crypto";
import {
  WatcherTypeEnum,
  type PaginationParams,
  type LensEntry,
} from "../types/index";
import Database from "libsql";
import { nowISO } from "@lensjs/date";
import { lensStream } from "../utils/event_emitter";

const TABLE_NAME = "lens_entries";
const BYTES_IN_GB = 1024 * 1024 * 1024;
const PRUNE_BATCH_SIZE = 1000;

export default class BetterSqliteStore extends Store {
  protected connection!: Database.Database;

  public async initialize() {
    this.connection = new Database("lens.db");

    this.setupSchema();
    console.log("Connected to Lens (SQLite) database.");
  }

  public async truncate() {
    this.connection.prepare(`DELETE FROM ${TABLE_NAME};`).run();
  }

  public async save(entry: {
    id?: string;
    data: Record<string, any>;
    minimal_data?: Record<string, any>;
    type: WatcherTypeEnum;
    timestamp?: string;
    requestId?: string;
  }) {
    const id = entry.id ?? randomUUID();
    const createdAt = entry.timestamp ?? nowISO();
    let lensEntryId = entry.requestId || null;
    const minimal = entry.minimal_data ?? {};

    // An upsert of the same id without a request context (e.g. a job finishing in
    // a worker after being enqueued in a request) must not null out the
    // correlation captured on the first save — keep the existing one.
    if (lensEntryId === null && entry.id) {
      const existing = this.connection
        .prepare(`SELECT lens_entry_id FROM ${TABLE_NAME} WHERE id = $id`)
        .get({ id }) as { lens_entry_id: string | null } | undefined;
      if (existing?.lens_entry_id) lensEntryId = existing.lens_entry_id;
    }

    // INSERT OR REPLACE so re-saving the same id (e.g. a job progressing from
    // active -> completed) replaces the row with a fresh rowid; unique-id
    // signals never conflict, so they behave as a plain insert.
    const info = this.connection
      .prepare(
        `INSERT OR REPLACE INTO ${TABLE_NAME} (id, data, type, created_at, lens_entry_id, minimal_data) values($id, $data, $type, $created_at, $lens_entry_id, $minimalData)`,
      )
      .run({
        id,
        data: this.stringifyData(entry.data),
        type: entry.type,
        created_at: createdAt,
        lens_entry_id: lensEntryId,
        minimalData: this.stringifyData(minimal),
      });

    // Push to the live-tail stream. Prefer the compact minimal_data; fall back
    // to the full data for watchers that don't provide one (e.g. queries).
    try {
      lensStream.emit("entry", {
        cursor: Number(info.lastInsertRowid),
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

    this.maybePruneDatabase();
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
    const rows = this.connection
      .prepare(
        `${this.getSelectedColumns(includeFullData)} FROM ${TABLE_NAME} WHERE type = $type AND lens_entry_id = $requestId ORDER BY created_at DESC`,
      )
      .all({ type, requestId });

    return this.mapRows(rows, includeFullData);
  }

  public async paginate<T>(
    type: WatcherTypeEnum,
    params: PaginationParams,
    includeFullData: boolean = true,
  ): Promise<{
    meta: {
      nextCursor: number | null;
      headCursor: number | null;
      hasMore: boolean;
      perPage: number;
    };
    data: T;
  }> {
    // Cursor pagination on the implicit rowid (monotonic with insertion order,
    // indexed by default). Ordering by rowid DESC yields newest-first without a
    // COUNT(*) — we fetch one extra row to cheaply detect whether more exist.
    // `after` fetches rows NEWER than a cursor (live delta polling); `cursor`
    // fetches rows OLDER than a cursor (infinite scroll); neither = newest page.
    // Any explicit sort (a non-time field, or time ascending) switches to
    // offset-based ordering, which cannot drive the live/delta feed.
    const { cursor, after, perPage, sort, dir } = params;
    const columns = this.getSelectedColumns(includeFullData).replace(
      /^SELECT /,
      "SELECT rowid AS __cursor, ",
    );
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
        ? `${this.sortExpr(sortField, params.numericSort)} ${dirSql}, rowid DESC`
        : "rowid ASC";

      const rows = this.connection
        .prepare(
          `${columns} FROM ${TABLE_NAME} WHERE type = ?${filter.sql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
        )
        .all(type, ...filter.args, limit, offset);

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
      rows = this.connection
        .prepare(
          `${columns} FROM ${TABLE_NAME} WHERE type = ?${filter.sql} AND rowid > ? ORDER BY rowid DESC LIMIT ?`,
        )
        .all(type, ...filter.args, after, limit);
    } else if (cursor != null) {
      rows = this.connection
        .prepare(
          `${columns} FROM ${TABLE_NAME} WHERE type = ?${filter.sql} AND rowid < ? ORDER BY rowid DESC LIMIT ?`,
        )
        .all(type, ...filter.args, cursor, limit);
    } else {
      rows = this.connection
        .prepare(
          `${columns} FROM ${TABLE_NAME} WHERE type = ?${filter.sql} ORDER BY rowid DESC LIMIT ?`,
        )
        .all(type, ...filter.args, limit);
    }

    const hasMore = rows.length > perPage;
    const pageRows = hasMore ? rows.slice(0, perPage) : rows;

    // Rows are DESC: [0] is the newest (head), [last] is the oldest of the page.
    const headCursor = pageRows.length
      ? cursorAt(pageRows[0])
      : (after ?? null);
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
      const path = `$.${f.field}`;

      if (f.op === "eq" || f.op === "ne") {
        parts.push(
          `CAST(json_extract(minimal_data, ?) AS TEXT) ${
            f.op === "eq" ? "=" : "<>"
          } ?`,
        );
        args.push(path, f.value);
      } else {
        const num = Number(f.value);
        if (!Number.isFinite(num)) continue;
        const opSql = { gt: ">", gte: ">=", lt: "<", lte: "<=" }[f.op];
        parts.push(
          `CAST(json_extract(minimal_data, ?) AS REAL) ${opSql} ?`,
        );
        args.push(path, num);
      }
    }

    if (q && q.trim()) {
      parts.push("minimal_data LIKE ?");
      args.push(`%${q.trim()}%`);
    }

    return { sql: parts.length ? ` AND ${parts.join(" AND ")}` : "", args };
  }

  /**
   * SQL ORDER BY expression for a `minimal_data` field. `field` is pre-validated
   * to a safe json-path charset by the caller before it reaches here.
   */
  private sortExpr(field: string, numeric?: boolean): string {
    const path = `'$.${field}'`;
    return numeric
      ? `CAST(json_extract(minimal_data, ${path}) AS REAL)`
      : `json_extract(minimal_data, ${path}) COLLATE NOCASE`;
  }

  override async latest<T>(
    { cursor, after, perPage }: PaginationParams,
    includeFullData: boolean = false,
  ): Promise<{
    meta: {
      nextCursor: number | null;
      headCursor: number | null;
      hasMore: boolean;
      perPage: number;
    };
    data: T;
  }> {
    // Same cursor/delta semantics as `paginate`, but across ALL watcher types —
    // the source for the unified live-tail feed and its polling fallback.
    const columns = this.getSelectedColumns(includeFullData).replace(
      /^SELECT /,
      "SELECT rowid AS __cursor, ",
    );
    const limit = perPage + 1;

    let rows: any[];
    if (after != null) {
      rows = this.connection
        .prepare(`${columns} FROM ${TABLE_NAME} WHERE rowid > ? ORDER BY rowid DESC LIMIT ?`)
        .all(after, limit);
    } else if (cursor != null) {
      rows = this.connection
        .prepare(`${columns} FROM ${TABLE_NAME} WHERE rowid < ? ORDER BY rowid DESC LIMIT ?`)
        .all(cursor, limit);
    } else {
      rows = this.connection
        .prepare(`${columns} FROM ${TABLE_NAME} ORDER BY rowid DESC LIMIT ?`)
        .all(limit);
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
    const result = this.connection
      .prepare(`SELECT count(*) as count FROM ${TABLE_NAME} WHERE type = ?`)
      .get(type) as { count: number };

    return Number(result.count);
  }

  public async find(type: WatcherTypeEnum, id: string) {
    const row = this.connection
      .prepare(
        `${this.getSelectedColumns()} FROM ${TABLE_NAME} WHERE id = ? AND type = ? LIMIT 1`,
      )
      .get(id, type);

    if (!row) {
      return null;
    }

    return this.mapRow(row, true);
  }

  private setupSchema() {
    // Enable WAL mode for concurrency
    this.connection.exec("PRAGMA journal_mode = WAL;");
    this.connection.exec("PRAGMA synchronous = NORMAL;"); // safer for concurrent writes

    const createTable = `
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id TEXT PRIMARY KEY,
        minimal_data TEXT,
        data TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        lens_entry_id TEXT NULL
      );
    `;

    const createIndex = `
      CREATE INDEX IF NOT EXISTS lens_entries_id_type_index
      ON ${TABLE_NAME} (id, type);
    `;
    const lensEntryIdIndex = `
      CREATE INDEX IF NOT EXISTS lens_entry_id_index
      ON ${TABLE_NAME} (lens_entry_id);
    `;

    this.connection.exec(createTable);
    this.connection.exec(createIndex);
    this.connection.exec(lensEntryIdIndex);
  }

  private maybePruneDatabase() {
    const maxGb = this.storeConfig?.dbMaxSizeGb;
    const pruneGb = this.storeConfig?.dbPruneSizeGb;

    if (!maxGb || !pruneGb) return;

    const maxBytes = maxGb * BYTES_IN_GB;
    const pruneBytes = pruneGb * BYTES_IN_GB;

    if (maxBytes <= 0 || pruneBytes <= 0) return;

    const targetBytes = Math.max(0, maxBytes - pruneBytes);

    let usedBytes = this.getDatabaseUsedBytes();

    if (usedBytes < maxBytes) return;

    while (usedBytes > targetBytes) {
      const deletedRows = this.deleteOldestEntries(PRUNE_BATCH_SIZE);
      if (deletedRows === 0) break;
      usedBytes = this.getDatabaseUsedBytes();
    }

    this.connection.exec("PRAGMA wal_checkpoint(TRUNCATE);");
  }

  private getDatabaseUsedBytes() {
    const pageSizeResult = this.connection
      .prepare("PRAGMA page_size;")
      .get() as { page_size: number };
    const pageCountResult = this.connection
      .prepare("PRAGMA page_count;")
      .get() as { page_count: number };
    const freelistCountResult = this.connection
      .prepare("PRAGMA freelist_count;")
      .get() as { freelist_count: number };
    const usedPages =
      pageCountResult.page_count - freelistCountResult.freelist_count;

    return usedPages * pageSizeResult.page_size;
  }

  private deleteOldestEntries(batchSize: number) {
    const result = this.connection
      .prepare(
        `DELETE FROM ${TABLE_NAME} WHERE id IN (SELECT id FROM ${TABLE_NAME} ORDER BY created_at ASC LIMIT ?)`,
      )
      .run(batchSize) as { changes?: number };

    return Number(result.changes ?? 0);
  }

  protected mapRow(row: any, includeFullData = true): LensEntry {
    let data = includeFullData ? JSON.parse(row.data) : {};

    if (!includeFullData) {
      data = JSON.parse(row.minimal_data);
    }

    return {
      id: row.id,
      type: row.type,
      created_at: row.created_at,
      lens_entry_id: row.lens_entry_id,
      data: data,
    };
  }

  protected mapRows(rows: any[], includeFullData = true) {
    let mappedRows: LensEntry[] = [];

    for (const row of rows) {
      mappedRows.push(this.mapRow(row, includeFullData));
    }

    return mappedRows;
  }

  protected getSelectedColumns(includeFullData: boolean = true) {
    return `SELECT id, minimal_data, type, created_at, lens_entry_id ${
      includeFullData ? ",data" : ""
    }`;
  }
}
