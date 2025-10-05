import type {
  PaginationParams,
  Paginator,
  LensEntry,
  WatcherTypeEnum,
} from "../types";

type MinimalPaginatePromise = Promise<Paginator<Omit<LensEntry, "data">[]>>;
export default abstract class Store {
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
  ): Promise<Paginator<T>>;

  abstract count(type: WatcherTypeEnum): Promise<number>;

  getAllExceptions(
    _paginationParams: PaginationParams,
  ): MinimalPaginatePromise {
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
        currentPage: 0,
        lastPage: 0,
        total: 0,
      },
    });
  }
}
