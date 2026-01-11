import Store from "../abstracts/store";
import { randomUUID } from "crypto";
import {
  WatcherTypeEnum,
  type PaginationParams,
  type LensEntry,
} from "../types/index";
import Database from "libsql";
import { nowISO } from "@lensjs/date";

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
    this.connection
      .prepare(
        `INSERT INTO ${TABLE_NAME} (id, data, type, created_at, lens_entry_id, minimal_data) values($id, $data, $type, $created_at, $lens_entry_id, $minimalData)`,
      )
      .run({
        id: entry.id ?? randomUUID(),
        data: this.stringifyData(entry.data),
        type: entry.type,
        created_at: entry.timestamp ?? nowISO(),
        lens_entry_id: entry.requestId || null,
        minimalData: this.stringifyData(entry.minimal_data ?? {}),
      });

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
    { page, perPage }: PaginationParams,
    includeFullData: boolean = true,
  ): Promise<{
    meta: {
      total: number;
      lastPage: number;
      currentPage: number;
    };
    data: T;
  }> {
    const offset = (page - 1) * perPage;
    const query = `${this.getSelectedColumns(
      includeFullData,
    )} FROM ${TABLE_NAME} WHERE type = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const count = await this.count(type);
    const rows = this.connection.prepare(query).all(type, perPage, offset);
    const mappedRows = this.mapRows(rows, includeFullData);

    return {
      meta: {
        total: count,
        lastPage: Math.ceil(count / perPage),
        currentPage: page,
      },
      data: mappedRows as T,
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
