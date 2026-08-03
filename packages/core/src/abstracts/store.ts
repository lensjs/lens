import type {
  PaginationParams,
  Paginator,
  LensEntry,
  WatcherTypeEnum,
  QueuedStoreConfig,
} from "../types";

type MinimalPaginatePromise = Promise<Paginator<Omit<LensEntry, "data">[]>>;
export default abstract class Store {
  protected storeConfig?: QueuedStoreConfig;
  constructor(...args: any[]) {}
  abstract initialize(): Promise<void>;
  abstract save(entry: {
    id?: string;
    data: Record<string, any>;
    minimal_data?: Record<string, any>;
    type: WatcherTypeEnum;
    timestamp?: string;
    requestId?: string;
  }): Promise<void>;
  abstract getAllRequests(
    paginationParams: PaginationParams,
  ): MinimalPaginatePromise;
  abstract getAllQueries(
    paginationParams: PaginationParams,
  ): Promise<Paginator<LensEntry[]>>;
  abstract getAllCacheEntries(
    paginationParams: PaginationParams,
  ): MinimalPaginatePromise;
  abstract allByRequestId(
    requestId: string,
    type: WatcherTypeEnum,
    includeFullData?: boolean,
  ): Promise<LensEntry[]>;
  abstract find(type: WatcherTypeEnum, id: string): Promise<LensEntry | null>;
  abstract truncate(): Promise<void>;
  abstract paginate<T>(
    type: WatcherTypeEnum,
    pagination: PaginationParams,
    includeFullData?: boolean,
  ): Promise<Paginator<T>>;

  abstract count(type: WatcherTypeEnum): Promise<number>;

  /**
   * Delete entries older than an ISO-8601 cutoff, optionally scoped to a single
   * watcher type; returns the number of rows deleted. Defaults to a no-op so
   * custom stores keep working until they opt into age-based retention.
   */
  pruneOlderThan(
    _cutoffISO: string,
    _type?: WatcherTypeEnum,
  ): Promise<number> {
    return Promise.resolve(0);
  }

  /**
   * Newest entries across ALL watcher types (cursor/delta paginated). Powers the
   * unified live-tail feed and its polling fallback. Defaults to empty so custom
   * stores keep working until they opt in.
   */
  latest<T>(
    _pagination: PaginationParams,
    _includeFullData?: boolean,
  ): Promise<Paginator<T>> {
    return this.defaultMinimalPaginate() as unknown as Promise<Paginator<T>>;
  }

  getAllExceptions(
    _paginationParams: PaginationParams,
  ): MinimalPaginatePromise {
    return this.defaultMinimalPaginate();
  }

  getAllEmails(_paginationParams: PaginationParams): MinimalPaginatePromise {
    return this.defaultMinimalPaginate();
  }

  protected stringifyData(data: Record<string, any> | string) {
    if (typeof data === "string") {
      return data;
    }

    try {
      return JSON.stringify(data);
    } catch (e) {
      console.error(`Failed to stringify lens data: ${e}`);
    }
  }

  protected defaultMinimalPaginate(): MinimalPaginatePromise {
    return Promise.resolve({
      data: [],
      meta: {
        nextCursor: null,
        headCursor: null,
        hasMore: false,
        perPage: 0,
      },
    });
  }
}
